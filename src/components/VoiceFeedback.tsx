import { Loader2, Pause, Play, RotateCcw, Settings2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { issuesOf, type InspectionResult } from "@/lib/inspection";
import {
  hindiItem,
  loadVoicePrefs,
  saveVoicePrefs,
  type VoicePrefs,
} from "@/lib/voice";
import { generateVoiceFeedback } from "@/lib/voice.functions";

/**
 * Hindi supervisor voice feedback. Generates a fresh spoken message from the
 * actual findings after every analysis and highlights each area while speaking.
 */
export function VoiceFeedback({
  guardName,
  result,
  onHighlight,
}: {
  guardName: string;
  result: InspectionResult;
  onHighlight: (item: string | null) => void;
}) {
  const speak = useServerFn(generateVoiceFeedback);
  const [prefs, setPrefs] = useState<VoicePrefs | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const orderRef = useRef<string[]>([]);
  orderRef.current = order;
  const highlightRef = useRef(onHighlight);
  highlightRef.current = onHighlight;

  useEffect(() => setPrefs(loadVoicePrefs()), []);

  const issues = issuesOf(result);

  const load = useCallback(
    async (p: VoicePrefs, autoplay: boolean) => {
      setState("loading");
      setError("");
      try {
        const res = await speak({
          data: {
            guardName,
            correct: result.checklist.filter((c) => c.status === "correct").map((c) => hindiItem(c.item)),
            findings: issuesOf(result).map((c) => ({
              item: c.item,
              hindi: hindiItem(c.item),
              status: c.status === "missing" ? ("missing" as const) : ("needs_correction" as const),
              severity: c.severity ?? "medium",
              recommendation: c.recommendation ?? "",
            })),
            gender: p.gender,
            rate: p.rate,
          },
        });
        setText(res.text);
        setOrder(res.order.length ? res.order : issuesOf(result).map((c) => c.item));
        const audio = new Audio(`data:audio/mpeg;base64,${res.audio}`);
        audio.muted = muted;
        audioRef.current?.pause();
        audioRef.current = audio;
        audio.onplay = () => setPlaying(true);
        audio.onpause = () => setPlaying(false);
        audio.onended = () => {
          setPlaying(false);
          highlightRef.current(null);
        };
        audio.ontimeupdate = () => {
          const list = orderRef.current;
          if (!list.length || !Number.isFinite(audio.duration) || audio.duration === 0) return;
          // The intro covers roughly the first third; spread items over the rest.
          const start = audio.duration * 0.3;
          const span = (audio.duration - start) / list.length;
          const idx = Math.floor((audio.currentTime - start) / span);
          highlightRef.current(idx >= 0 && idx < list.length ? list[idx] : null);
        };
        setState("ready");
        if (autoplay) {
          audio.play().catch(() => setPlaying(false));
        }
      } catch (e) {
        setState("error");
        setError(e instanceof Error ? e.message : "आवाज़ संदेश नहीं बन सका।");
      }
    },
    [guardName, muted, result, speak],
  );

  const started = useRef(false);
  useEffect(() => {
    if (!prefs || started.current) return;
    started.current = true;
    if (prefs.enabled) void load(prefs, true);
  }, [prefs, load]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      highlightRef.current(null);
    };
  }, []);

  function update(next: VoicePrefs, regenerate: boolean) {
    setPrefs(next);
    saveVoicePrefs(next);
    if (!next.enabled) {
      audioRef.current?.pause();
      highlightRef.current(null);
      return;
    }
    if (regenerate || state === "idle") void load(next, false);
  }

  if (!prefs) return null;

  return (
    <section className="rounded-2xl bg-card p-4 card-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">सुपरवाइज़र की आवाज़ में सुझाव</p>
          <p className="truncate text-xs text-muted-foreground">
            {issues.length ? `${issues.length} कमियों पर मार्गदर्शन` : "आज सब कुछ सही है"}
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="आवाज़ सेटिंग">
              <Settings2 className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="voice-on" className="text-sm font-semibold">
                हिंदी आवाज़
              </Label>
              <Switch
                id="voice-on"
                checked={prefs.enabled}
                onCheckedChange={(v) => update({ ...prefs, enabled: v }, v)}
              />
            </div>
            <div>
              <p className="text-sm font-semibold">आवाज़ चुनें</p>
              <div className="mt-2 flex rounded-full bg-muted p-1">
                {([
                  { key: "female" as const, label: "महिला" },
                  { key: "male" as const, label: "पुरुष" },
                ]).map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={prefs.gender === o.key}
                    onClick={() => update({ ...prefs, gender: o.key }, prefs.enabled)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      prefs.gender === o.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">बोलने की गति — {prefs.rate.toFixed(2)}x</p>
              <Slider
                className="mt-3"
                min={0.7}
                max={1.3}
                step={0.05}
                value={[prefs.rate]}
                onValueChange={([v]) => setPrefs({ ...prefs, rate: v })}
                onValueCommit={([v]) => update({ ...prefs, rate: v }, prefs.enabled)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {!prefs.enabled ? (
        <p className="mt-3 text-xs text-muted-foreground">हिंदी आवाज़ बंद है।</p>
      ) : state === "loading" ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> आवाज़ संदेश तैयार हो रहा है…
        </p>
      ) : state === "error" ? (
        <div className="mt-3">
          <p className="text-xs text-destructive">{error}</p>
          <Button
            variant="outline"
            className="mt-2 h-10 font-bold"
            onClick={() => void load(prefs, true)}
          >
            फिर कोशिश करें
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            <Button
              className="h-12 flex-1 font-bold"
              onClick={() => {
                const a = audioRef.current;
                if (!a) return void load(prefs, true);
                if (playing) a.pause();
                else void a.play().catch(() => setPlaying(false));
              }}
            >
              {playing ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
              {playing ? "रोकें" : "सुनें"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="दोबारा सुनें"
              className="h-12 w-12"
              onClick={() => {
                const a = audioRef.current;
                if (!a) return void load(prefs, true);
                a.currentTime = 0;
                void a.play().catch(() => setPlaying(false));
              }}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={muted ? "आवाज़ चालू करें" : "आवाज़ बंद करें"}
              className="h-12 w-12"
              onClick={() => {
                const next = !muted;
                setMuted(next);
                if (audioRef.current) audioRef.current.muted = next;
              }}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
          {text ? (
            <p className="mt-3 rounded-xl bg-muted/60 p-3 text-sm leading-relaxed text-foreground">
              {text}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
