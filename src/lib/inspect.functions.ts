import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  AUTO_FAIL_RULES,
  CHECKLIST_SPECS,
  CRITICALITY_WEIGHT,
  type ChecklistResult,
  type InspectionResult,
} from "./inspection";

const Input = z.object({
  guardPhoto: z.string().min(10),
  referenceImage: z.string().min(10),
});

const CRITERIA = CHECKLIST_SPECS.map(
  (s, i) =>
    `${i + 1}. ${s.item} [${s.criticality}] — PASS: ${s.pass} | FAIL: ${s.fail}`,
).join("\n");

const PROMPT = `You are a strict uniform inspection officer for ICICI Bank security guards.
You are given TWO images:
1. The IDEAL UNIFORM REFERENCE image (how the uniform should look).
2. The GUARD PHOTO to be inspected.

Inspect the guard photo against this official 13-point checklist and its pass/fail criteria:
${CRITERIA}

For each item assign exactly one status:
"correct" | "missing" | "incorrectly_worn" | "damaged" | "not_visible".
Use "not_visible" only when the body part genuinely is not in frame.

AUTO-FAIL RULES — if any of these are true, the overall verdict MUST be "fail" and the reason must be listed in autoFailReasons:
${AUTO_FAIL_RULES.map((r) => `- ${r}`).join("\n")}

List critical issues (any High criticality item that is not correct) and write a short supervisor summary.

Respond with STRICT JSON only, no markdown, in this exact shape:
{"overall":"pass"|"needs_attention"|"fail","checklist":[{"item":"Blue Cap","status":"correct","note":"short note"}],"criticalIssues":["..."],"autoFailReasons":["..."],"summary":"..."}
Use the exact item names from the checklist above.`;

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

    const parsed = JSON.parse(match[0]) as Partial<InspectionResult>;
    const byName = new Map((parsed.checklist ?? []).map((c) => [c.item, c]));

    const checklist: ChecklistResult[] = CHECKLIST_SPECS.map((spec) => {
      const found = byName.get(spec.item);
      return {
        item: spec.item,
        status: found?.status ?? "not_visible",
        note: found?.note ?? "Not assessed",
        criticality: spec.criticality,
      };
    });

    // Weighted score: correct = full weight, not_visible = half, everything else = 0.
    const totalWeight = CHECKLIST_SPECS.reduce(
      (sum, s) => sum + CRITICALITY_WEIGHT[s.criticality],
      0,
    );
    const earned = checklist.reduce((sum, c) => {
      const w = CRITICALITY_WEIGHT[c.criticality ?? "Minor"];
      if (c.status === "correct") return sum + w;
      if (c.status === "not_visible") return sum + w * 0.5;
      return sum;
    }, 0);
    const score = Math.round((earned / totalWeight) * 100);

    const autoFailReasons = parsed.autoFailReasons ?? [];
    const overall = autoFailReasons.length > 0 || score < 60
      ? "fail"
      : score < 90
        ? "needs_attention"
        : "pass";

    return {
      overall,
      score,
      summary: parsed.summary ?? "",
      criticalIssues: parsed.criticalIssues ?? [],
      autoFailReasons,
      checklist,
    };
  });
