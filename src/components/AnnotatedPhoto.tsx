import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  annotationLabel,
  annotationsOf,
  SEVERITY_META,
  type ChecklistResult,
  type InspectionResult,
} from "@/lib/inspection";

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Photo with an AI annotation overlay. Boxes are rendered from normalised
 * (0–1) coordinates supplied by the vision response, so nothing is hard-coded.
 */
export function AnnotatedPhoto({
  photo,
  alt,
  result,
  highlight = null,
}: {
  photo: string;
  alt: string;
  result: InspectionResult;
  /** Item name currently being spoken — its box pulses. */
  highlight?: string | null;
}) {
  const annotations = annotationsOf(result);
  const [annotated, setAnnotated] = useState(true);
  const [active, setActive] = useState<ChecklistResult | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);

  const zoomAt = useCallback((next: number, px: number, py: number) => {
    setZoom((z) => {
      const target = clamp(next, MIN_ZOOM, MAX_ZOOM);
      const k = target / z;
      setOffset((o) => {
        if (target === MIN_ZOOM) return { x: 0, y: 0 };
        return { x: px - (px - o.x) * k, y: py - (py - o.y) * k };
      });
      return target;
    });
  }, []);

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      zoomAtRef.current(
        zoomRef.current * Math.exp(-dy * 0.0018),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function reset() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function stepZoom(dir: 1 | -1) {
    const el = containerRef.current;
    const rect = el?.getBoundingClientRect();
    zoomAt(zoom * (dir === 1 ? 1.4 : 1 / 1.4), (rect?.width ?? 0) / 2, (rect?.height ?? 0) / 2);
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-card card-shadow">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">Inspection Photo</p>
          <p className="truncate text-xs text-muted-foreground">
            {annotations.length
              ? `${annotations.length} issue${annotations.length > 1 ? "s" : ""} marked by AI`
              : "No marked areas"}
          </p>
        </div>
        <div className="flex shrink-0 rounded-full bg-muted p-1">
          {[
            { key: false, label: "Original" },
            { key: true, label: "AI Marked" },
          ].map((t) => (
            <button
              key={String(t.key)}
              type="button"
              aria-pressed={annotated === t.key}
              onClick={() => setAnnotated(t.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                annotated === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-3/4 w-full touch-none overflow-hidden bg-secondary"
        onPointerDown={(e) => {
          if (zoom === 1) return;
          drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        >
          <img src={photo} alt={alt} className="h-full w-full object-cover" draggable={false} />

          {annotated
            ? annotations.map((c) => {
                const sev = SEVERITY_META[c.severity ?? "medium"];
                const b = c.box!;
                const live = highlight === c.item;
                return (
                  <button
                    key={c.item}
                    type="button"
                    onClick={() => setActive(c)}
                    aria-label={`${annotationLabel(c)} — ${sev.label} issue`}
                    className={`absolute rounded-md bg-transparent ${
                      live ? "animate-pulse border-4" : "border-2"
                    }`}
                    style={{
                      left: `${b.x * 100}%`,
                      top: `${b.y * 100}%`,
                      width: `${b.width * 100}%`,
                      height: `${b.height * 100}%`,
                      borderColor: sev.color,
                      boxShadow: live
                        ? `0 0 0 3px ${sev.color}55, 0 0 24px ${sev.color}`
                        : `0 0 0 9999px transparent, 0 0 12px ${sev.color}`,
                    }}
                  >
                    <span
                      className="absolute left-0 top-0 max-w-[160px] -translate-y-full truncate rounded-t-md px-1.5 py-0.5 text-[10px] font-bold leading-tight"
                      style={{
                        backgroundColor: sev.color,
                        color: c.severity === "minor" ? "#1f1f1f" : "#ffffff",
                        fontSize: `${clamp(10 / zoom, 4, 10)}px`,
                      }}
                    >
                      {annotationLabel(c)}
                    </span>
                  </button>
                );
              })
            : null}
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <IconBtn label="Zoom in" onClick={() => stepZoom(1)}>
            <Plus className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Zoom out" onClick={() => stepZoom(-1)}>
            <Minus className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Reset zoom" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </IconBtn>
        </div>
      </div>

      {annotated && annotations.length ? (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
          {annotations.map((c) => {
            const sev = SEVERITY_META[c.severity ?? "medium"];
            return (
              <button
                key={c.item}
                type="button"
                onClick={() => setActive(c)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: sev.color }}
                />
                {annotationLabel(c)}
              </button>
            );
          })}
        </div>
      ) : null}

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-[92vw] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: SEVERITY_META[active?.severity ?? "medium"].color }}
              />
              {active ? annotationLabel(active) : ""}
            </DialogTitle>
            <DialogDescription className="text-left">
              {SEVERITY_META[active?.severity ?? "medium"].label} issue detected by AI
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Why it was flagged
              </p>
              <p className="mt-1 text-foreground">{active?.reason}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Recommended correction
              </p>
              <p className="mt-1 font-semibold text-foreground">{active?.recommendation}</p>
            </div>
          </div>
          <Button className="h-12 w-full font-bold" onClick={() => setActive(null)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur"
    >
      {children}
    </button>
  );
}
