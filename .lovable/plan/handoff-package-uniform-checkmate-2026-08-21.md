# Handoff Package: Uniform CheckMate

Goal: produce a document another AI tool (Claude) or a developer can follow to rebuild/run this app exactly as it behaves today, with every Lovable-specific dependency clearly flagged and swappable for another AI provider.

## What gets delivered

A single markdown handoff document, `HANDOFF.md`, in the project root (plus a downloadable copy in your documents area), containing:

1. **App overview** — purpose (ICICI guard uniform self-inspection), the two roles (guard, supervisor), and the full screen-by-screen flow: login by ID, auto 8-second countdown front camera, AI check, annotated results with Hindi voice, complete/submit, supervisor history and reports.
2. **Tech stack and file map** — TanStack Start + React 19 + Vite + Tailwind v4, every route and component with a one-line description of what it does, and where local storage of the last 15 inspections lives.
3. **Business rules** — the 13-point checklist, the three statuses (correct / needs correction / missing), severity levels, auto-fail rules, front-view validation rule, belt-buckle rule, and the "no scores or percentages" rule.
4. **AI integration section (the flagged part)** — clearly marked callouts for every place the app talks to Lovable:
   - `src/lib/inspect.functions.ts` → vision analysis call
   - `src/lib/voice.functions.ts` → Hindi script + text-to-speech calls
   - `LOVABLE_API_KEY` server-side secret
   - base URL `https://ai.gateway.lovable.dev/v1`
   - the Lovable Vite preset `@lovable.dev/vite-tanstack-config` and what it replaces on a plain setup
   Each callout states: what it does, what the request/response shape is, and what to change to move off Lovable.
5. **Provider swap guide** — a table mapping the three AI capabilities (vision, text generation, text-to-speech) to direct OpenAI, Google Gemini, and Anthropic equivalents, with the exact endpoint, model, env-var name, and request-shape differences for each. Includes the note that Anthropic has no TTS, so TTS must stay with OpenAI/Google or fall back to the browser speech synthesis the app already has in `src/lib/speak.ts`.
6. **Prompts appendix** — the full vision prompt and the Hindi voice prompt copied verbatim, since these carry most of the product logic.
7. **Deployment notes** — current Cloudflare Workers/Nitro target, and what to change for Node hosting (Railway, Render, VPS) or Vercel.
8. **A "paste this into Claude" starter prompt** at the top of the document, so you can hand the file over and get a working rebuild in one shot.

## Optional code change (say yes and it's included)

Introduce a small provider abstraction so the swap is a config change rather than an edit:

- New `src/lib/ai-provider.server.ts` exporting `chatCompletion()`, `visionCompletion()`, and `textToSpeech()`.
- Provider chosen by an `AI_PROVIDER` env var (`lovable` default, plus `openai` and `gemini`), with each provider's base URL, key name, and model ids in one table.
- `inspect.functions.ts` and `voice.functions.ts` call the abstraction instead of fetching the gateway directly. No behaviour change on the default path.

## Technical notes

- The document is written for both a human developer and an LLM: explicit file paths, complete code snippets for the AI call sites, and no reliance on reading the repo to understand the flow.
- No AI logic, prompt wording, or UI behaviour changes as part of the document itself.
