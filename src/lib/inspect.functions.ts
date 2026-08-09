import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  CHECKLIST_SPECS,
  RECOMMENDATION_BY_ITEM,
  type ChecklistResult,
  type InspectionResult,
  SEVERITY_BY_ITEM,
  type BoundingBox,
  type ItemStatus,
  type Severity,
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

HIGHEST PRIORITY RULE — IMAGE VALIDATION FIRST. NO FRONT VIEW, NO INSPECTION.
Before any uniform analysis, decide whether the GUARD PHOTO is a clear, full FRONT VIEW
of one person: the person faces the camera, the face and torso are clearly visible and
not blurred, and the body from cap to shoes is mostly in frame. Treat these as NOT a
front view: back view, side/profile view, head turned away, close-up of only part of the
body, heavily blurred or very dark photo, no person in the photo, or an object/screenshot.
If it is NOT a clear front view, DO NOT analyse the uniform, DO NOT guess, and DO NOT
return a checklist. Respond with STRICT JSON only:
{"front_view":false,"message":"<polite request in simple words asking for a clear full front view photo, max 25 words>"}

Only if it IS a clear front view, continue with the checklist below.

Check the guard photo against this 13-point checklist:
${CRITERIA}

For each item assign exactly one status:
"correct" — the item meets the standard
"needs_correction" — the item is present but worn wrongly, damaged, dirty or not visible
"missing" — the item is not there at all

Do NOT give any score, percentage, rating or marks.
For every item that is not "correct", write a very short recommendation in simple words
(max 8 words), for example "Name badge missing" or "Shirt is not tucked in".

For every item that is not "correct" also return:
- "severity": "critical" (safety/identity items like ID card, badges, damaged uniform),
  "medium" (clearly visible uniform faults) or "minor" (small grooming or neatness faults).
- "reason": one short sentence saying what you saw in the photo that made you flag it (max 15 words).
- "box": the location of the problem ON THE GUARD PHOTO as a normalised bounding box
  {"x":0.0-1.0,"y":0.0-1.0,"width":0.0-1.0,"height":0.0-1.0} where x,y is the TOP-LEFT
  corner as a fraction of the photo width/height. For a missing item, box the place where
  it should be. Omit "box" only if you truly cannot localise it.

Respond with STRICT JSON only, no markdown, in this exact shape:
{"front_view":true,"checklist":[{"item":"Blue Cap","status":"correct","recommendation":"","severity":"minor","reason":"","box":{"x":0.4,"y":0.05,"width":0.2,"height":0.12}}]}
Use the exact item names from the checklist above.`;

const STATUSES: ItemStatus[] = ["correct", "needs_correction", "missing"];
const SEVERITIES: Severity[] = ["critical", "medium", "minor"];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Keeps only well-formed, in-frame boxes so the overlay never renders garbage. */
function normaliseBox(raw: unknown): BoundingBox | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const b = raw as Record<string, unknown>;
  const nums = ["x", "y", "width", "height"].map((k) => Number(b[k]));
  if (nums.some((n) => !Number.isFinite(n))) return undefined;
  let [x, y, width, height] = nums as [number, number, number, number];
  // Tolerate percentage-style (0-100) coordinates.
  if (x > 1 || y > 1 || width > 1 || height > 1) {
    x /= 100;
    y /= 100;
    width /= 100;
    height /= 100;
  }
  if (width <= 0 || height <= 0) return undefined;
  x = clamp01(x);
  y = clamp01(y);
  return {
    x,
    y,
    width: clamp01(Math.min(width, 1 - x)),
    height: clamp01(Math.min(height, 1 - y)),
  };
}

export type InspectResponse =
  | { ok: true; result: InspectionResult }
  | { ok: false; message: string };

export const inspectUniform = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<InspectResponse> => {
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

    const parsed = JSON.parse(match[0]) as {
      front_view?: boolean;
      message?: string;
      checklist?: ChecklistResult[];
    };

    // Highest priority rule: no clear front view, no inspection.
    if (parsed.front_view === false || !parsed.checklist?.length) {
      throw new Error(
        (parsed.message ?? "").trim() ||
          "Please share a clear full front view photo, standing straight and facing the camera.",
      );
    }

    const byName = new Map((parsed.checklist ?? []).map((c) => [c.item, c]));

    const checklist: ChecklistResult[] = CHECKLIST_SPECS.map((spec) => {
      const found = byName.get(spec.item);
      const status: ItemStatus =
        found && STATUSES.includes(found.status) ? found.status : "needs_correction";
      if (status === "correct") return { item: spec.item, status };
      const recommendation =
        (found?.recommendation ?? "").trim() || RECOMMENDATION_BY_ITEM[spec.item] || spec.fail;
      const severity: Severity =
        found?.severity && SEVERITIES.includes(found.severity)
          ? found.severity
          : (SEVERITY_BY_ITEM[spec.item] ?? "medium");
      const reason = (found?.reason ?? "").trim() || spec.fail;
      const box = normaliseBox(found?.box);
      return { item: spec.item, status, recommendation, severity, reason, ...(box ? { box } : {}) };
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
