import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Finding = z.object({
  item: z.string(),
  hindi: z.string(),
  status: z.enum(["needs_correction", "missing"]),
  severity: z.enum(["critical", "medium", "minor"]),
  recommendation: z.string().optional().default(""),
});

const Input = z.object({
  guardName: z.string().default(""),
  correct: z.array(z.string()).default([]),
  findings: z.array(Finding).default([]),
  gender: z.enum(["male", "female"]).default("female"),
  rate: z.number().min(0.7).max(1.3).default(1),
});

export interface VoiceFeedback {
  /** Hindi script that was spoken. */
  text: string;
  /** Checklist item names in the order they are mentioned. */
  order: string[];
  /** base64 mp3 audio. */
  audio: string;
}

const SEVERITY_HI = { critical: "बड़ी", medium: "मध्यम", minor: "छोटी" } as const;
const RANK = { critical: 0, medium: 1, minor: 2 } as const;

function buildPrompt(data: z.infer<typeof Input>) {
  const sorted = [...data.findings].sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const lines = sorted.length
    ? sorted
        .map(
          (f, i) =>
            `${i + 1}. ${f.hindi} (${f.item}) — ${SEVERITY_HI[f.severity]} कमी — ${
              f.status === "missing" ? "गायब है" : "सही नहीं है"
            }${f.recommendation ? ` — सुझाव: ${f.recommendation}` : ""}`,
        )
        .join("\n")
    : "कोई कमी नहीं मिली।";

  const okList = data.correct.length ? data.correct.join(", ") : "कुछ नहीं";

  return `आप एक ICICI बैंक के अनुभवी सुरक्षा सुपरवाइज़र हैं जो गार्ड को आदरपूर्वक, शांत और आत्मविश्वास भरे स्वर में मौखिक फीडबैक दे रहे हैं।

आज की जाँच के नतीजे:
सही पाई गई चीज़ें (हिंदी में बोलें): ${okList}
मिली कमियाँ (इसी क्रम में — पहले बड़ी, फिर मध्यम, फिर छोटी):
${lines}

नियम:
- केवल स्वाभाविक, बोलचाल की हिंदी लिखें। कोई अंग्रेज़ी वाक्य नहीं (सामान्य शब्द जैसे "आई डी कार्ड", "शर्ट", "बेल्ट" चलेंगे)।
- शुरुआत विनम्र "नमस्ते" से करें${data.guardName ? ` और गार्ड का नाम "${data.guardName}" लें` : ""}।
- पहले संक्षेप में बताएं कि क्या-क्या सही है (अगर कुछ सही है)।
- फिर केवल ऊपर दी गई कमियाँ, उसी क्रम में, हर एक के लिए एक छोटा सुधार सुझाव।
- कोई अंक, प्रतिशत, रेटिंग या मार्क्स न बोलें।
- अंत में एक छोटा, प्रोत्साहन भरा वाक्य।
- कुल लंबाई ऐसी हो कि बोलने में 15 से 20 सेकंड लगें (लगभग 45 से 60 शब्द)।
- हर बार वाक्य-रचना अलग रखें, रटा-रटाया न लगे, पर अर्थ वही रहे।

सिर्फ़ इस JSON आकार में उत्तर दें, कोई markdown नहीं:
{"text":"पूरा हिंदी संदेश","order":["${sorted.map((f) => f.item).join('","')}"]}
"order" में ठीक वही अंग्रेज़ी item नाम उसी क्रम में रखें जिस क्रम में संदेश में उनका ज़िक्र है।`;
}

export const generateVoiceFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<VoiceFeedback> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("आवाज़ सेवा उपलब्ध नहीं है।");

    const chat = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        temperature: 1.1,
        messages: [{ role: "user", content: buildPrompt(data) }],
      }),
    });
    if (chat.status === 429) throw new Error("अभी बहुत अनुरोध हैं, थोड़ी देर बाद कोशिश करें।");
    if (!chat.ok) throw new Error(`आवाज़ संदेश नहीं बन सका (${chat.status}).`);

    const json = (await chat.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    let text = "";
    let order: string[] = [];
    if (match) {
      try {
        const p = JSON.parse(match[0]) as { text?: string; order?: string[] };
        text = (p.text ?? "").trim();
        order = Array.isArray(p.order) ? p.order.filter((o) => typeof o === "string") : [];
      } catch {
        /* fall through to raw text */
      }
    }
    if (!text) text = raw.trim();
    if (!text) throw new Error("आवाज़ संदेश नहीं बन सका।");

    const speech = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: text,
        voice: data.gender === "male" ? "onyx" : "shimmer",
        instructions:
          "Speak in natural conversational Hindi with a neutral Indian accent. Calm, confident, respectful — like a senior Indian security supervisor guiding a colleague. Never sound robotic or foreign.",
        speed: data.rate,
        response_format: "mp3",
        stream_format: "audio",
      }),
    });
    if (!speech.ok) {
      const body = await speech.text().catch(() => "");
      console.error(`TTS failed [${speech.status}]: ${body}`);
      throw new Error(`आवाज़ नहीं बन सकी (${speech.status}).`);
    }

    const buf = await speech.arrayBuffer();
    return { text, order, audio: Buffer.from(buf).toString("base64") };
  });
