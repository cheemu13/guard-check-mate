# Uniform CheckMate — Engineering Handoff

ICICI Bank security guard uniform self-inspection app.
This document is written so that another AI assistant (e.g. Claude) or a developer can rebuild,
run, or port this app **without reading the rest of the repo**.

> ### Paste-into-Claude starter prompt
>
> ```
> You are taking over an existing React app called "Uniform CheckMate".
> The attached HANDOFF.md fully specifies the product, the screens, the AI prompts,
> and every external API call. Rebuild / maintain the app exactly as specified.
>
> Important: every AI call currently goes through the Lovable AI Gateway
> (https://ai.gateway.lovable.dev/v1) using a LOVABLE_API_KEY server secret.
> These call sites are marked in the document with "LOVABLE DEPENDENCY".
> Replace them with <OpenAI | Google Gemini | Anthropic> direct APIs using the
> "Provider swap guide" section, keeping the request/response contracts identical.
> Do not change prompts, checklist rules, statuses, or UI text.
> ```

---

## 1. What the app does

A security guard photographs themself; an AI vision model compares the photo with an ideal
uniform reference image and returns a 13-point checklist. The result is shown as annotated
bounding boxes over the photo and read aloud in natural Hindi.

**There are no scores, percentages, marks or ratings anywhere in the product. This is a hard rule.**

### Roles

| Role | Login | Can do |
|---|---|---|
| Security Guard (default) | Employee ID only (no PIN, no name field) | Take today's inspection, see own results and history |
| Supervisor | Username + password, reached via a small shield icon at top-right of the login screen | View inspection results, history and reports. **No photo capture.** |

### Guard flow (screen by screen)

1. **Login** (`/`) — centered "Uniform CheckMate" title, Employee ID field only. No logo, no footer text. Supervisor access is a small shield icon, top-right.
2. **Inspection** (`/inspection/new`) — on mount, Hindi voice guidance auto-plays via browser speech synthesis:
   "फ़ोन को दो से तीन फ़ुट दूर रखें… सीधे खड़े हों ताकि पूरा शरीर दिखे… आठ सेकंड की गिनती के बाद फ़ोटो अपने-आप खिंच जाएगी।"
   Shown on the screen: the ideal uniform reference image, a swipeable/auto-rotating 360° guard view, and a full-body silhouette framing guide with the instruction text placed **below** the silhouette.
3. **Capture** — tapping capture opens the **front-facing camera** (widest available front lens where supported) and immediately starts a visible **8 → 1 countdown**, then auto-captures. No gallery/upload option. No "Use this photo" confirmation — analysis starts automatically. Only a **Retake** action remains.
4. **AI analysis** — the photo plus the reference image go to the vision model. Hindi voice feedback generation starts in parallel.
5. **Results** (`/results/$id`) — annotated photo with severity-coloured bounding boxes (zoomable, toggleable), checklist with three statuses, short recommendations, and an auto-playing Hindi voice panel that pulses each box as it is mentioned (critical → medium → minor order).
6. **Complete** (`/complete/$id`) — confirmation and the "सबमिट करें" (Submit) button.

### Supervisor flow

`/supervisor` (read-only dashboard), `/history`, `/reports` (list + PDF export via `jspdf`), `/my-checks` (guard's own past checks), `/reference` (uniform standard guide with pass/fail example photos + 360° view), `/settings`.

---

## 2. Tech stack

- **TanStack Start v1** (file-based routing, `createServerFn` RPC) + **React 19**
- **Vite 8**, **Tailwind CSS v4** (theme tokens in `src/styles.css`)
- **shadcn/ui** (Radix primitives) + **lucide-react** icons + **sonner** toasts
- **zod** for server-fn input validation, **jspdf** for report export
- **No database.** All inspection records live client-side in **IndexedDB**.
- Server runtime: **Nitro**, default preset **Cloudflare Workers** (see §7).

### File map

| Path | Purpose |
|---|---|
| `src/routes/index.tsx` | Login screen; guard ID login + supervisor shield icon |
| `src/routes/inspection.new.tsx` | Capture screen; auto Hindi guidance, camera, kicks off AI analysis |
| `src/routes/results.$id.tsx` | Annotated results + Hindi voice panel |
| `src/routes/complete.$id.tsx` | "Inspection complete" + Submit |
| `src/routes/history.tsx`, `my-checks.tsx` | Past inspections |
| `src/routes/supervisor.tsx`, `reports.tsx` | Supervisor read-only views + PDF export |
| `src/routes/reference.tsx` | Uniform standard guide, pass/fail examples, 360° viewer |
| `src/routes/settings.tsx` | Voice preferences (on/off, male/female, rate) |
| `src/routes/__root.tsx` | Root layout, head metadata, Toaster |
| `src/components/CountdownCamera.tsx` | Front camera + 8-second countdown + auto-capture |
| `src/components/BodySilhouetteGuide.tsx` | Static SVG framing guide, instruction below silhouette |
| `src/components/AnnotatedPhoto.tsx` | SVG bounding-box overlay, zoom, severity colours, toggles |
| `src/components/VoiceFeedback.tsx` | Hindi audio playback, autoplay, box pulse sync |
| `src/components/Guard360.tsx` | 8-frame 360° viewer, swipe/arrows, auto-rotate after 2s |
| `src/components/AppHeader.tsx` | Shared header (no avatar/logo thumbnail) |
| `src/lib/inspection.ts` | Checklist specs, statuses, severities, Hindi metadata, record CRUD |
| `src/lib/store.ts` | IndexedDB record store (async API), legacy localStorage drain |
| `src/lib/auth.ts` | Session in localStorage (`icici-session`), `guard` / `supervisor` roles |
| `src/lib/voice.ts` | Voice prefs + Hindi names for the 13 items |
| `src/lib/speak.ts` | Browser `speechSynthesis` Hindi guidance (no API call) |
| `src/lib/reference-images.ts` | 39 categorised reference photos (pass/fail examples) |
| **`src/lib/inspect.functions.ts`** | **LOVABLE DEPENDENCY** — vision inspection server fn |
| **`src/lib/voice.functions.ts`** | **LOVABLE DEPENDENCY** — Hindi script + TTS server fn |

### Persistence

- Records are stored in IndexedDB `icici-guard-check`, object store `inspections` (v1).
  A pre-existing `localStorage["icici-inspections"]` is drained on first open.
- Each record embeds the base64 guard photo (~200–400 KB), which is why localStorage was abandoned.
- `navigator.storage.persist()` is requested so records survive storage pressure.
- **At least the 15 most recent inspections are retained** (`MAX_STORED_INSPECTIONS = 15`), older ones pruned.
- Session: `localStorage["icici-session"]`. Voice prefs: `localStorage["icici-voice-prefs"]`.

---

## 3. Business rules

### The 13-point checklist (`CHECKLIST_SPECS` in `src/lib/inspection.ts`)

| # | Item | Correct | Not correct | Default severity |
|---|---|---|---|---|
| 1 | Blue Cap | Present and worn properly | Missing or not worn properly | medium |
| 2 | Blue Shirt Condition | Clean, no stains, tears, not faded | Torn, faded, stained, damaged | critical |
| 3 | Shirt Worn Properly | Tucked in and buttoned | Untucked, buttons open, sleeves rolled | medium |
| 4 | Collar | Folded properly | Not folded properly | minor |
| 5 | Chest Badge | Fully visible from front | Not visible or missing | critical |
| 6 | Side Sleeve Badge | Fully visible on sleeve | Not visible or missing | medium |
| 7 | ID Card Lanyard | Hangs outside shirt, readable | Missing, hidden, backside, unreadable | critical |
| 8 | Blue Epaulette with Button | Visible on both shoulders | Missing or damaged | minor |
| 9 | Black Belt with Metal Buckle | Correct belt, fastened | Missing or incorrect | medium |
| 10 | Blue Trouser | No stains, holes, fading, wrinkles | Wrong colour or torn | medium |
| 11 | Black Shoes | Black, formal, polished | Dirty, not formal, laceless, wrong colour | medium |
| 12 | Black Socks | Black, above ankle | Below ankle, missing, wrong colour | minor |
| 13 | Grooming & Accessories | Neat hair/beard, no chains or bracelets | Untidy, jewellery visible | minor |

Each item also carries a short fix instruction (`recommendation`), e.g. "Tuck in your shirt and button it fully".

### Statuses

`correct` ✅ | `needs_correction` ⚠️ | `missing` ❌ — nothing else. Overall status is
`all_correct` or `action_needed` (any non-correct item ⇒ `action_needed`).

### Severity

`critical` | `medium` | `minor`, used only to colour bounding boxes and to order the spoken
feedback (critical first). Severity is **not** a score.

### Special rules

- **Front-view validation (highest priority).** Before any uniform analysis the model must decide
  whether the photo is a clear full front view of one person. Back/side view, turned head, partial
  crop, blur, darkness, no person, or a screenshot ⇒ **no analysis, no checklist, no guessing**.
  It returns `{"front_view":false,"message":"…"}` and the UI shows a retake prompt instead of results.
- **Belt buckle rule.** If the buckle is **clearly visible** and off-centre or slanted, flag
  "Black Belt with Metal Buckle" as `needs_correction` with severity `minor`, a box around the
  buckle, and a recommendation like "Belt buckle is not centred". If it is not clearly visible,
  do not check alignment at all.
- **Full-body requirement.** If the whole body head-to-toe is not visible, submission is blocked
  with a request for a clear front-facing full-body photo, offering Retake.
- Recommendations max 8 words; reasons max 15 words. No scores anywhere.

### Bounding boxes

Normalised `{x, y, width, height}` in 0–1, `x,y` = top-left as a fraction of photo width/height.
`normaliseBox()` tolerates 0–100 percentage style, clamps to frame, drops malformed boxes.
For a missing item, the box marks where the item *should* be.

---

## 4. LOVABLE DEPENDENCIES — every external call, flagged

There are **three** AI HTTP calls and **one** build-time package. Nothing else touches Lovable.

### 🚩 4.1 Vision inspection — `src/lib/inspect.functions.ts`

```
POST https://ai.gateway.lovable.dev/v1/chat/completions
Headers: Content-Type: application/json
         Lovable-API-Key: <LOVABLE_API_KEY>
         X-Lovable-AIG-SDK: fetch
Body:    { model: "google/gemini-3.6-flash",
           messages: [{ role: "user", content: [
             { type: "text", text: PROMPT },
             { type: "text", text: "IDEAL UNIFORM REFERENCE IMAGE:" },
             { type: "image_url", image_url: { url: <reference data URL> } },
             { type: "text", text: "GUARD PHOTO TO CHECK:" },
             { type: "image_url", image_url: { url: <guard photo data URL> } } ]}] }
```

This is an **OpenAI-compatible chat/completions** shape — the body is portable to OpenAI as-is.
Response is read from `choices[0].message.content`, the first `{...}` block is extracted with a
regex and `JSON.parse`d (the model is asked for strict JSON, no markdown).

Returned union (never throws for a bad photo):
```ts
type InspectResponse =
  | { ok: true;  result: { overall: "all_correct" | "action_needed";
                           checklist: ChecklistResult[]; recommendations: string[] } }
  | { ok: false; message: string };   // front-view validation failure
```
Error handling: `429` → "Too many requests…", `402` → "Service limit reached…", other non-OK → generic failure.

### 🚩 4.2 Hindi feedback script — `src/lib/voice.functions.ts`

```
POST https://ai.gateway.lovable.dev/v1/chat/completions
Headers: Lovable-API-Key: <LOVABLE_API_KEY>, X-Lovable-AIG-SDK: fetch
Body:    { model: "google/gemini-3.6-flash", temperature: 1.1,
           messages: [{ role: "user", content: <Hindi prompt, see appendix> }] }
```
Expects `{"text":"<Hindi message>","order":["<item names in spoken order>"]}`.
`order` drives the bounding-box pulse sync on the results screen.

### 🚩 4.3 Hindi text-to-speech — `src/lib/voice.functions.ts`

```
POST https://ai.gateway.lovable.dev/v1/audio/speech
Headers: Authorization: Bearer <LOVABLE_API_KEY>   ← note: bearer, not the Lovable-API-Key header
         Content-Type: application/json
Body:    { model: "openai/gpt-4o-mini-tts",
           input: <Hindi text>,
           voice: "onyx" (male) | "shimmer" (female),
           instructions: "Speak in natural conversational Hindi with a neutral Indian accent.
                          Calm, confident, respectful — like a senior Indian security supervisor
                          guiding a colleague. Never sound robotic or foreign.",
           speed: 0.7–1.3, response_format: "mp3", stream_format: "audio" }
```
The mp3 ArrayBuffer is base64-encoded and returned as `{ text, order, audio }`.
This is the **OpenAI audio/speech API** shape, proxied — portable to OpenAI by changing only the
base URL, auth header value and the model id (`gpt-4o-mini-tts`).

### 🚩 4.4 Secret — `LOVABLE_API_KEY`

- Read **only** inside `createServerFn` handlers as `process.env["LOVABLE_API_KEY"]`.
- Never prefixed with `VITE_`, never sent to the browser, never committed.
- On Lovable hosting it is injected automatically. **On any other host you must set it yourself.**
- Missing key ⇒ the server fn throws a user-facing message ("Uniform check is not configured on this device." / "आवाज़ सेवा उपलब्ध नहीं है।").

### 🚩 4.5 Build-time package — `@lovable.dev/vite-tanstack-config` (devDependency `2.13.1`)

`vite.config.ts` is just:
```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig({ tanstackStart: { server: { entry: "server" } } });
```
That preset bundles: TanStack devtools, `tanstackStart`, `@vitejs/plugin-react`,
`@tailwindcss/vite`, `vite-tsconfig-paths`, the `nitro` build plugin (Cloudflare preset by default),
`VITE_*` env injection, the `@` path alias, React/TanStack dedupe, and Lovable error-logging plugins.

**To remove it**, write a plain `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: { alias: { "@": "/src" } },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    nitro({ config: { preset: "node-server" } }),  // or "cloudflare_module" / "vercel"
    react(),
  ],
});
```
Also delete `src/lib/lovable-error-reporting.ts` and its callers in `src/lib/error-capture.ts`
if you want zero Lovable references; they only forward client errors to the Lovable preview and
are harmless (and inert) outside it.

### Not dependencies

No Lovable Cloud, no Supabase, no database, no auth service, no email, no storage bucket.
Guard/supervisor "login" is entirely local (`localStorage`) — **there is no real authentication**;
add one before any production rollout.

---

## 5. Provider swap guide

Three capabilities need a provider. Introduce one env var, `AI_PROVIDER`, and one config table.

| Capability | Used by | Lovable (current) | OpenAI direct | Google Gemini direct | Anthropic |
|---|---|---|---|---|---|
| Vision + JSON | `inspect.functions.ts` | `POST /v1/chat/completions`, model `google/gemini-3.6-flash` | `POST https://api.openai.com/v1/chat/completions`, model `gpt-4o` / `gpt-4.1` — **same body** | `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` — different body (see below) | `POST https://api.anthropic.com/v1/messages`, model `claude-sonnet-4` — different body |
| Text generation (Hindi script) | `voice.functions.ts` | same endpoint/model | same as above | same as above | same as above |
| Text-to-speech | `voice.functions.ts` | `POST /v1/audio/speech`, `openai/gpt-4o-mini-tts` | `POST https://api.openai.com/v1/audio/speech`, `gpt-4o-mini-tts` — **same body** | Gemini TTS (`gemini-2.5-flash-preview-tts`) or Google Cloud TTS (`hi-IN` voices) | **none — Anthropic has no TTS** |

**Auth header per provider**

| Provider | Header | Env var |
|---|---|---|
| Lovable | `Lovable-API-Key: <key>` (TTS uses `Authorization: Bearer <key>`) | `LOVABLE_API_KEY` |
| OpenAI | `Authorization: Bearer <key>` | `OPENAI_API_KEY` |
| Gemini | `x-goog-api-key: <key>` | `GEMINI_API_KEY` |
| Anthropic | `x-api-key: <key>` + `anthropic-version: 2023-06-01` | `ANTHROPIC_API_KEY` |

**Easiest port (recommended): OpenAI.** Both current call shapes are already OpenAI-compatible.
Change per call site: base URL `https://ai.gateway.lovable.dev/v1` → `https://api.openai.com/v1`,
header → `Authorization: Bearer ${process.env.OPENAI_API_KEY}`, drop `X-Lovable-AIG-SDK`,
model → `gpt-4o` (vision/text) and `gpt-4o-mini-tts` (speech). Everything else — prompts, parsing,
error handling — stays byte-identical.

**Gemini direct** needs a body rewrite: images become
`{ inlineData: { mimeType: "image/jpeg", data: "<base64 without the data: prefix>" } }` inside
`contents[0].parts`, and the text is read from `candidates[0].content.parts[0].text`.

**Anthropic** needs `{ model, max_tokens, messages:[{role:"user",content:[{type:"text",text},{type:"image",source:{type:"base64",media_type:"image/jpeg",data}}]}] }`
and the text is at `content[0].text`. **TTS must stay with OpenAI/Google**, or fall back to the
browser speech synthesis the app already ships in `src/lib/speak.ts` (`speechSynthesis`, `hi-IN`),
which needs no API at all.

**Suggested abstraction** (not yet implemented — one small file makes the swap a config change):

```ts
// src/lib/ai-provider.server.ts
type Provider = "lovable" | "openai" | "gemini";
const PROVIDER = (process.env["AI_PROVIDER"] ?? "lovable") as Provider;

const CONFIG = {
  lovable: { base: "https://ai.gateway.lovable.dev/v1", keyEnv: "LOVABLE_API_KEY",
             authHeader: (k: string) => ({ "Lovable-API-Key": k, "X-Lovable-AIG-SDK": "fetch" }),
             visionModel: "google/gemini-3.6-flash", textModel: "google/gemini-3.6-flash",
             ttsModel: "openai/gpt-4o-mini-tts" },
  openai:  { base: "https://api.openai.com/v1", keyEnv: "OPENAI_API_KEY",
             authHeader: (k: string) => ({ Authorization: `Bearer ${k}` }),
             visionModel: "gpt-4o", textModel: "gpt-4o", ttsModel: "gpt-4o-mini-tts" },
  // gemini: needs the body adapter described above
} as const;

export async function chatCompletion(body: unknown) { /* POST `${base}/chat/completions` */ }
export async function textToSpeech(body: unknown) { /* POST `${base}/audio/speech` */ }
```
Then `inspect.functions.ts` and `voice.functions.ts` call these instead of `fetch`ing the gateway
directly. Default path (`lovable`) behaves exactly as today.

**Rate limits / errors, whichever provider:** `429` → back off and retry, `402`/`insufficient_quota`
→ terminal, show "Service limit reached", any other non-OK → generic retryable message. Never
silently swallow an AI failure into a fake "all correct" result.

---

## 6. Prompts appendix (verbatim — these carry most of the product logic)

### 6.1 Vision prompt (`src/lib/inspect.functions.ts`)

`${CRITERIA}` is the 13 rows of §3 rendered as `N. <item> — CORRECT: <pass> | NOT CORRECT: <fail>`.

```
You are checking the uniform of an ICICI Bank security guard.
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

EXTRA RULE — BELT BUCKLE ALIGNMENT (only for "Black Belt with Metal Buckle"):
If the belt buckle is CLEARLY visible and it is off-centre (not at the middle of the waist)
or slanted/tilted, mark that item as "needs_correction" with "severity":"minor",
a short recommendation like "Belt buckle is not centred", a reason describing what you saw,
and a box around the buckle. If the buckle is not clearly visible, do NOT check its alignment
and do NOT flag it for this reason.

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
Use the exact item names from the checklist above.
```

### 6.2 Hindi voice prompt (`src/lib/voice.functions.ts`)

Findings are pre-sorted critical → medium → minor before being interpolated.

```
आप एक ICICI बैंक के अनुभवी सुरक्षा सुपरवाइज़र हैं जो गार्ड को आदरपूर्वक, शांत और आत्मविश्वास भरे स्वर में मौखिक फीडबैक दे रहे हैं।

आज की जाँच के नतीजे:
सही पाई गई चीज़ें (हिंदी में बोलें): ${okList}
मिली कमियाँ (इसी क्रम में — पहले बड़ी, फिर मध्यम, फिर छोटी):
${lines}

नियम:
- केवल स्वाभाविक, बोलचाल की हिंदी लिखें। कोई अंग्रेज़ी वाक्य नहीं (सामान्य शब्द जैसे "आई डी कार्ड", "शर्ट", "बेल्ट" चलेंगे)।
- शुरुआत विनम्र "नमस्ते" से करें और गार्ड का नाम लें।
- पहले संक्षेप में बताएं कि क्या-क्या सही है (अगर कुछ सही है)।
- फिर केवल ऊपर दी गई कमियाँ, उसी क्रम में, हर एक के लिए एक छोटा सुधार सुझाव।
- कोई अंक, प्रतिशत, रेटिंग या मार्क्स न बोलें।
- अंत में एक छोटा, प्रोत्साहन भरा वाक्य।
- कुल लंबाई ऐसी हो कि बोलने में 15 से 20 सेकंड लगें (लगभग 45 से 60 शब्द)।
- हर बार वाक्य-रचना अलग रखें, रटा-रटाया न लगे, पर अर्थ वही रहे।

सिर्फ़ इस JSON आकार में उत्तर दें, कोई markdown नहीं:
{"text":"पूरा हिंदी संदेश","order":["<item names>"]}
"order" में ठीक वही अंग्रेज़ी item नाम उसी क्रम में रखें जिस क्रम में संदेश में उनका ज़िक्र है।
```

Line format for each finding:
`N. <hindi item> (<English item>) — <बड़ी|मध्यम|छोटी> कमी — <गायब है|सही नहीं है> — सुझाव: <recommendation>`

Hindi item names live in `HINDI_ITEM` in `src/lib/voice.ts` (e.g. `ID Card Lanyard → पहचान पत्र`).

### 6.3 On-screen guidance (no API — `src/lib/speak.ts`)

Browser `speechSynthesis` with `lang: "hi-IN"`, spoken automatically when the capture screen mounts.

---

## 7. Running and deploying

```bash
npm install
LOVABLE_API_KEY=<key> npm run dev      # http://localhost:8080
npm run build                          # Nitro output in .output/
```

Scripts: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`.
The camera requires **HTTPS or localhost** — `getUserMedia` is blocked on plain HTTP origins.

| Target | Nitro preset | Notes |
|---|---|---|
| Lovable (current) | `cloudflare` (default from the Lovable preset) | `LOVABLE_API_KEY` injected automatically |
| Cloudflare Workers | `cloudflare_module` | Set the key as a Worker secret |
| Node host (Railway, Render, Fly, VPS) | `node-server` | Start command `node .output/server/index.mjs`; set the key as an env var |
| Vercel | `vercel` | Set the key in Project → Environment Variables |

`src/server.ts` is the SSR entry (an error-reporting wrapper) and uses a
`fetch(request, env, ctx)` handler shape; on Node presets Nitro adapts it — no code change needed.
There are no Cloudflare-specific bindings, so the app is portable.

**On any non-Lovable host the AI key is not injected — you must configure it yourself.**

---

## 8. Known gaps / recommended next steps

1. **No real authentication.** Login is a local ID string; any user can pick any role. Add a real identity provider before production.
2. **No server-side storage.** Inspections are only on the device — clearing browser data loses them. Add a backend if supervisors must see other guards' records across devices.
3. **Prompt-based JSON.** The vision call relies on the model returning strict JSON; using a provider's structured-output/JSON-schema mode would make it more robust.
4. **No retry/backoff** on `429` — currently surfaced as an error to the user.
5. Full-body detection depends on the model's judgement, not a separate pose model.
