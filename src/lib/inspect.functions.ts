import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  CHECKLIST_SPECS,
  RECOMMENDATION_BY_ITEM,
  type ChecklistResult,
  type InspectionResult,
  type ItemStatus,
} from "./inspection";

const Input = z.object({
  guardPhoto: z.string().min(10),
  referenceImage: z.string().min(10),
});

const CRITERIA = CHECKLIST_SPECS.map(
  (s, i) => `${i + 1}. ${s.item} — CORRECT: ${s.pass} | NOT CORRECT: ${s.fail}`,
).join("\n");

const PROMPT = `You are checking the uniform of an ICICI Bank security guard.
You are given TWO images:
1. The IDEAL UNIFORM REFERENCE image (how the uniform should look).
2. The GUARD PHOTO to be checked.

Check the guard photo against this 13-point checklist:
${CRITERIA}

For each item assign exactly one status:
"correct" — the item meets the standard
"needs_correction" — the item is present but worn wrongly, damaged, dirty or not visible
"missing" — the item is not there at all

Do NOT give any score, percentage, rating or marks.
For every item that is not "correct", write a very short recommendation in simple words
(max 8 words), for example "Name badge missing" or "Shirt is not tucked in".

Respond with STRICT JSON only, no markdown, in this exact shape:
{"checklist":[{"item":"Blue Cap","status":"correct","recommendation":""}]}
Use the exact item names from the checklist above.`;

const STATUSES: ItemStatus[] = ["correct", "needs_correction", "missing"];

export const inspectUniform = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<InspectionResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Uniform check is not configured on this device.");

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
              { type: "text", text: "GUARD PHOTO TO CHECK:" },
              { type: "image_url", image_url: { url: data.guardPhoto } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Too many requests. Please try again shortly.");
    if (res.status === 402) throw new Error("Service limit reached. Please contact your supervisor.");
    if (!res.ok) throw new Error(`Uniform check failed (${res.status}). Please try again.`);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read the uniform check response.");

    const parsed = JSON.parse(match[0]) as { checklist?: ChecklistResult[] };
    const byName = new Map((parsed.checklist ?? []).map((c) => [c.item, c]));

    const checklist: ChecklistResult[] = CHECKLIST_SPECS.map((spec) => {
      const found = byName.get(spec.item);
      const status: ItemStatus =
        found && STATUSES.includes(found.status) ? found.status : "needs_correction";
      if (status === "correct") return { item: spec.item, status };
      const recommendation =
        (found?.recommendation ?? "").trim() || RECOMMENDATION_BY_ITEM[spec.item] || spec.fail;
      return { item: spec.item, status, recommendation };
    });

    const recommendations = checklist
      .filter((c) => c.status !== "correct")
      .map((c) => c.recommendation ?? "")
      .filter(Boolean);

    return {
      overall: recommendations.length === 0 ? "all_correct" : "action_needed",
      checklist,
      recommendations,
    };
  });
