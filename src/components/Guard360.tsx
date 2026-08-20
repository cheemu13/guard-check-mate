import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import v0 from "@/assets/guard360-0-front.jpg.asset.json";
import v1 from "@/assets/guard360-1-front-right.jpg.asset.json";
import v2 from "@/assets/guard360-2-right.jpg.asset.json";
import v3 from "@/assets/guard360-3-back-right.jpg.asset.json";
import v4 from "@/assets/guard360-4-back.jpg.asset.json";
import v5 from "@/assets/guard360-5-back-left.jpg.asset.json";
import v6 from "@/assets/guard360-6-left.jpg.asset.json";
import v7 from "@/assets/guard360-7-front-left.jpg.asset.json";

const VIEWS = [
  { url: v0.url, label: "Front" },
  { url: v1.url, label: "Front Right" },
  { url: v2.url, label: "Right" },
  { url: v3.url, label: "Back Right" },
  { url: v4.url, label: "Back" },
  { url: v5.url, label: "Back Left" },
  { url: v6.url, label: "Left" },
  { url: v7.url, label: "Front Left" },
];

export function Guard360({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const startX = useRef<number | null>(null);

  const step = (d: number) => setI((p) => (p + d + VIEWS.length) % VIEWS.length);
  const manual = (fn: () => void) => {
    setAuto(false);
    fn();
  };

  useEffect(() => {
    if (!auto) return;
    const start = window.setTimeout(() => {
      const id = window.setInterval(() => step(1), 1200);
      timer.current = id;
    }, 2000);
    return () => {
      window.clearTimeout(start);
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [auto]);


  return (
    <div className={className}>
      <div
        className="relative overflow-hidden rounded-xl border border-border bg-white select-none"
        role="group"
        aria-label="360 degree uniform view"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
        onTouchStart={(e) => {
          startX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const s = startX.current;
          const x = e.changedTouches[0]?.clientX;
          if (s == null || x == null) return;
          const dx = x - s;
          if (Math.abs(dx) > 30) step(dx < 0 ? 1 : -1);
          startX.current = null;
        }}
      >
        {VIEWS.map((v, idx) => (
          <img
            key={v.url}
            src={v.url}
            alt={`ICICI security guard uniform — ${v.label} view`}
            loading={idx === 0 ? "eager" : "lazy"}
            className={`aspect-3/4 w-full bg-white object-contain transition-opacity duration-150 ${
              idx === i ? "" : "absolute inset-0 opacity-0"
            }`}
          />
        ))}

        <button
          type="button"
          aria-label="Rotate left"
          onClick={() => step(-1)}
          className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-foreground/60 text-background"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Rotate right"
          onClick={() => step(1)}
          className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-foreground/60 text-background"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground/60 px-3 py-1 text-[11px] font-semibold text-background">
          <RotateCw className="h-3 w-3" />
          {VIEWS[i]?.label}
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {VIEWS.map((v, idx) => (
          <button
            key={v.url}
            type="button"
            aria-label={`Show ${v.label} view`}
            onClick={() => setI(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-5 bg-primary" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Swipe or use the arrows to rotate 360°
      </p>
    </div>
  );
}
