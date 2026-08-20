import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";

/**
 * Full-screen device camera that starts a 5-second countdown as soon as it
 * opens and captures automatically at zero, so the guard can step back and
 * frame a full head-to-toe photo without touching the phone.
 */
export function CountdownCamera({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [count, setCount] = useState(5);
  const [error, setError] = useState("");
  const doneRef = useRef(false);

  const capture = useCallback(() => {
    if (doneRef.current) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    doneRef.current = true;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  }, [onCapture]);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        if (!cancelled) setError("Camera not available. Please allow camera access and try again.");
      }
    }
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  useEffect(() => {
    if (error) return;
    setCount(5);
    doneRef.current = false;
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          window.clearInterval(id);
          capture();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [capture, error, facing]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full object-cover"
        style={facing === "user" ? { transform: "scaleX(-1)" } : undefined}
      />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button
          aria-label="Close camera"
          onClick={onClose}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="mt-1 flex-1 text-center text-sm font-semibold text-white">
          Place the phone at a distance and stand full length in frame.
        </p>
        <button
          aria-label="Switch camera"
          onClick={() => setFacing(facing === "environment" ? "user" : "environment")}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {error ? (
        <div className="absolute inset-0 grid place-items-center px-8">
          <p role="alert" className="text-center text-base font-semibold text-white">
            {error}
          </p>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span
            key={count}
            aria-live="assertive"
            className="animate-in fade-in zoom-in text-[9rem] font-black leading-none text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
          >
            {count > 0 ? count : ""}
          </span>
        </div>
      )}
    </div>
  );
}
