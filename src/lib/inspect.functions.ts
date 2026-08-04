import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CHECKLIST_ITEMS, type InspectionResult } from "./inspection";

const Input = z.object({
  guardPhoto: z.string().min(10),
  referenceImage: z.string().min(10),
});

const PROMPT = `You are a strict uniform inspection officer for ICICI Bank security guards.
You are given TWO images:
1. The IDEAL UNIFORM REFERENCE image (how the uniform should look).
2. The GUARD PHOTO to be inspected.

Compare the guard photo against the reference and inspect each of these items:
${CHECKLIST_ITEMS.join(", ")}.

For each item assign exactly one status:
"correct" | "missing" | "incorrectly_worn" | "damaged" | "not_visible".

Then compute an inspection score from 0 to 100 (correct items score full, not_visible partial, missing/damaged/incorrectly_worn zero),
list critical issues (missing cap, missing ID card, missing name badge, untucked shirt, dirty or damaged uniform),
and write a short supervisor summary.

Respond with STRICT JSON only, no markdown, in this exact shape:
{"overall":"pass"|"needs_attention"|"fail","score":number,"checklist":[{"item":"Cap","status":"correct","note":"short note"}],"criticalIssues":["..."],"summary":"..."}`;

export const inspectUniform = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<InspectionResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured on this device.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "text", text: "IDEAL UNIFORM REFERENCE IMAGE:" },
              { type: "image_url", image_url: { url: data.referenceImage } },
              { type: "text", text: "GUARD PHOTO TO INSPECT:" },
              { type: "image_url", image_url: { url: data.guardPhoto } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Too many requests. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up to continue.");
    if (!res.ok) throw new Error(`Inspection failed (${res.status}). ${await res.text()}`);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read the AI inspection response.");

    const parsed = JSON.parse(match[0]) as InspectionResult;
    const known = new Set(CHECKLIST_ITEMS as readonly string[]);
    const byName = new Map((parsed.checklist ?? []).map((c) => [c.item, c]));
    return {
      overall: parsed.overall ?? "needs_attention",
      score: Math.max(0, Math.min(100, Math.round(parsed.score ?? 0))),
      summary: parsed.summary ?? "",
      criticalIssues: parsed.criticalIssues ?? [],
      checklist: CHECKLIST_ITEMS.map(
        (item) =>
          byName.get(item) ?? { item, status: "not_visible" as const, note: "Not assessed" },
      ).filter((c) => known.has(c.item)),
    };
  });
