import { Camera, Check, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type CheckKey = "presence" | "fullbody" | "distance" | "facing" | "light" | "steady";

const MESSAGES: Record<CheckKey, string> = {
  presence: "Step into the frame",
  fullbody: "Show full body — head to toe",
  distance: "Move back",
  facing: "Face the camera",
  light: "Improve lighting",
  steady: "Hold steady",
};

/**
 * Full-screen live camera with a body silhouette guide.
 * Frame quality is estimated from the video feed each tick; only one
 * instruction is surfaced at a time so the guard is never overloaded.
 */
export function LiveCameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const prevRef = useRef<Float32Array | null>(null);
  const greenSince = useRef<number | null>(null);
  const capturedRef = useRef(false);
  const detectorRef = useRef<{ detect: (v: HTMLVideoElement) => Promise<unknown[]> } | null>(null);
  const faceSeenAt = useRef(0);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [hint, setHint] = useState<string>("Position the security guard inside the frame.");
  const [flash, setFlash] = useState(false);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || capturedRef.current) return;
    capturedRef.current = true;
    const maxSize = 1024;
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFlash(true);
    onCapture(canvas.toDataURL("image/jpeg", 0.85));
  }, [onCapture]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;

    const FaceDetectorCtor = (
      window as unknown as { FaceDetector?: new (o?: unknown) => typeof detectorRef.current }
    ).FaceDetector;
    if (FaceDetectorCtor) {
      try {
        detectorRef.current = new FaceDetectorCtor({ fastMode: true }) as never;
      } catch {
        detectorRef.current = null;
      }
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setReady(true);
        tick();
      } catch {
        setError("Camera not available. Please allow camera access or use the gallery.");
      }
    }

    let lastFace = 0;
    function tick() {
      if (stopped) return;
      raf = window.requestAnimationFrame(tick);
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const w = 96;
      const h = 128;
      if (!workRef.current) workRef.current = document.createElement("canvas");
      const canvas = workRef.current;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);

      const gray = new Float32Array(w * h);
      let sum = 0;
      for (let i = 0; i < w * h; i++) {
        const g = (data[i * 4]! * 0.299 + data[i * 4 + 1]! * 0.587 + data[i * 4 + 2]! * 0.114) / 255;
        gray[i] = g;
        sum += g;
      }
      const brightness = sum / (w * h);

      // Edge map → rough subject silhouette + focus estimate.
      let edgeEnergy = 0;
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;
      let edgeCount = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          const gx = Math.abs(gray[i + 1]! - gray[i - 1]!);
          const gy = Math.abs(gray[i + w]! - gray[i - w]!);
          const m = gx + gy;
          edgeEnergy += m * m;
          if (m > 0.14) {
            edgeCount++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      const focus = edgeEnergy / (w * h);

      let motion = 0;
      const prev = prevRef.current;
      if (prev && prev.length === gray.length) {
        for (let i = 0; i < gray.length; i++) motion += Math.abs(gray[i]! - prev[i]!);
        motion /= gray.length;
      }
      prevRef.current = gray;

      const bboxH = edgeCount > 40 ? (maxY - minY) / h : 0;
      const bboxW = edgeCount > 40 ? (maxX - minX) / w : 0;
      const fill = edgeCount / (w * h);

      // Face check runs at a slower cadence; when unsupported it is skipped.
      const now = performance.now();
      if (detectorRef.current && now - lastFace > 700) {
        lastFace = now;
        detectorRef.current
          .detect(video)
          .then((faces) => {
            if (faces.length > 0) faceSeenAt.current = performance.now();
          })
          .catch(() => {
            detectorRef.current = null;
          });
      }
      const facingOk = !detectorRef.current || now - faceSeenAt.current < 2500;

      let failed: CheckKey | null = null;
      if (brightness < 0.18) failed = "light";
      else if (fill < 0.02 || bboxH < 0.25) failed = "presence";
      else if (bboxH > 0.985 || bboxW > 0.95) failed = "distance";
      else if (bboxH < 0.62) failed = "fullbody";
      else if (!facingOk) failed = "facing";
      else if (motion > 0.045) failed = "steady";
      else if (focus < 0.006) failed = "steady";

      const good = failed === null;
      setOk(good);
      setHint(
        good
          ? "Perfect – Ready to capture"
          : failed === "fullbody" && bboxH < 0.45
            ? "Move closer"
            : MESSAGES[failed!],
      );

      if (good) {
        if (greenSince.current === null) greenSince.current = now;
        else if (now - greenSince.current > 1000) capture();
      } else {
        greenSince.current = null;
      }
    }

    void start();
    return () => {
      stopped = true;
      window.cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [capture]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <p className="rounded-full bg-black/45 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
          Stand back so your full body is visible, head to toe.
        </p>
        <button
          aria-label="Close camera"
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/55 text-white backdrop-blur"
        >
          <X className="h-5 w-5" />
        </button>
      </div>


      {/* Status + capture */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-6 pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
        {error ? (
          <p className="rounded-xl bg-destructive px-4 py-3 text-center text-sm font-semibold text-destructive-foreground">
            {error}
          </p>
        ) : (
          <div
            role="status"
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-colors duration-300 ${
              ok ? "bg-[hsl(142_72%_38%)] animate-scale-in" : "bg-[hsl(0_72%_46%)]"
            }`}
          >
            {ok ? <Check className="h-4 w-4" /> : <RefreshCw className="h-4 w-4 animate-spin" />}
            {ready ? hint : "Starting camera…"}
          </div>
        )}
        <button
          aria-label="Capture photo"
          disabled={!ok}
          onClick={capture}
          className={`grid h-20 w-20 place-items-center rounded-full border-4 transition-all duration-300 ${
            ok
              ? "border-[hsl(142_72%_55%)] bg-white text-[hsl(142_72%_28%)] scale-100 shadow-[0_0_0_8px_hsl(142_72%_45%/0.25)]"
              : "border-white/40 bg-white/20 text-white/60 scale-95"
          }`}
        >
          <Camera className="h-8 w-8" />
        </button>
      </div>

      {flash ? <div className="pointer-events-none absolute inset-0 bg-white animate-fade-out" /> : null}
    </div>
  );
}
