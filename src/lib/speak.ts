/**
 * Plain-Hindi spoken guidance using the device's built-in voice.
 * Kept dependency-free so it can start the moment a screen opens.
 */

/** Guidance spoken on the photo capture screen, in simple everyday Hindi. */
export const CAPTURE_GUIDANCE_HI = [
  "कृपया फ़ोन को दो से तीन फुट दूर रखें।",
  "सीधे खड़े हों ताकि आपका पूरा शरीर दिख सके।",
  "आठ सेकंड की गिनती के बाद आपकी फ़ोटो अपने आप खिंच जाएगी।",
].join(" ");

function pickHindiVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang?.toLowerCase() === "hi-in") ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("hi"))
  );
}

/** Speaks Hindi text. Silently does nothing when speech is unavailable. */
export function speakHindi(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;

  const say = () => {
    try {
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "hi-IN";
      utter.rate = 0.95;
      const voice = pickHindiVoice();
      if (voice) utter.voice = voice;
      synth.speak(utter);
    } catch {
      /* speech is a nicety — never break the screen */
    }
  };

  // Voice list can load asynchronously on first use.
  if (synth.getVoices().length === 0) {
    const onVoices = () => {
      synth.removeEventListener("voiceschanged", onVoices);
      say();
    };
    synth.addEventListener("voiceschanged", onVoices);
    window.setTimeout(say, 600);
    return;
  }
  say();
}

export function stopSpeaking(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
