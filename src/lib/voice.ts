/** Client-side voice-feedback preferences (Hindi supervisor voice). */

export type VoiceGender = "male" | "female";

export interface VoicePrefs {
  enabled: boolean;
  gender: VoiceGender;
  /** Speech rate multiplier, 0.7–1.3. */
  rate: number;
}

export const VOICE_PREFS_KEY = "icici-voice-prefs";

export const DEFAULT_VOICE_PREFS: VoicePrefs = {
  enabled: true,
  gender: "female",
  rate: 1,
};

export function loadVoicePrefs(): VoicePrefs {
  if (typeof window === "undefined") return DEFAULT_VOICE_PREFS;
  try {
    const raw = window.localStorage.getItem(VOICE_PREFS_KEY);
    if (!raw) return DEFAULT_VOICE_PREFS;
    const p = JSON.parse(raw) as Partial<VoicePrefs>;
    return {
      enabled: p.enabled ?? true,
      gender: p.gender === "male" ? "male" : "female",
      rate: Math.min(1.3, Math.max(0.7, Number(p.rate) || 1)),
    };
  } catch {
    return DEFAULT_VOICE_PREFS;
  }
}

export function saveVoicePrefs(prefs: VoicePrefs) {
  window.localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify(prefs));
}

/** Hindi names for the 13 checklist items, used in on-screen text and speech. */
export const HINDI_ITEM: Record<string, string> = {
  "Blue Cap": "नीली टोपी",
  "Blue Shirt Condition": "नीली शर्ट की हालत",
  "Shirt Worn Properly": "शर्ट सही तरीके से पहनना",
  Collar: "कॉलर",
  "Chest Badge": "छाती का बैज",
  "Side Sleeve Badge": "आस्तीन का बैज",
  "ID Card Lanyard": "पहचान पत्र",
  "Blue Epaulette with Button": "कंधे की पट्टी",
  "Black Belt with Metal Buckle": "काली बेल्ट",
  "Blue Trouser": "नीली पतलून",
  "Black Shoes": "काले जूते",
  "Black Socks": "काले मोज़े",
  "Grooming & Accessories": "साज-सज्जा और आभूषण",
};

export const hindiItem = (item: string) => HINDI_ITEM[item] ?? item;
