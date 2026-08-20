import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Check, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import idealUniform from "@/assets/ideal-uniform-reference.jpg";
import { AppHeader } from "@/components/AppHeader";
import { BodySilhouetteGuide } from "@/components/BodySilhouetteGuide";
import { CountdownCamera } from "@/components/CountdownCamera";
import { Guard360 } from "@/components/Guard360";
import { Button } from "@/components/ui/button";
import { currentSession, logout } from "@/lib/auth";
import { inspectUniform } from "@/lib/inspect.functions";
import { saveInspection, type InspectionRecord } from "@/lib/inspection";
import { BRANCH_KEY } from "./settings";

export const Route = createFileRoute("/inspection/new")({
  head: () => ({
    meta: [
      { title: "Today's Inspection — ICICI Guard Uniform Check" },
      {
        name: "description",
        content:
          "Take your uniform photo and get a simple checklist telling you what is correct and what to fix.",
      },
      { property: "og:title", content: "Today's Inspection — ICICI Guard Uniform Check" },
      {
        property: "og:description",
        content: "Take your uniform photo and get a simple checklist of what to fix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewInspection,
});

async function urlToDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const FULL_BODY_MESSAGE =
  "Please capture a clear front-facing full-body photo; ensure the entire body from head to toe is visible.";

function NewInspection() {
  const navigate = useNavigate();
  const inspect = useServerFn(inspectUniform);

  const [branchName, setBranchName] = useState("");
  const [guardName, setGuardName] = useState("");
  const [guardId, setGuardId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoIssue, setPhotoIssue] = useState<string | null>(null);
  const [photoBlocked, setPhotoBlocked] = useState(false);

  useEffect(() => {
    const s = currentSession();
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    if (s.role === "supervisor") {
      navigate({ to: "/supervisor" });
      return;
    }
    setGuardName(s.name);
    setGuardId(s.id);
    setBranchName(window.localStorage.getItem(BRANCH_KEY) ?? "");
    setDateTime(new Date().toISOString());
  }, [navigate]);

  const canCheck = photo !== null && !photoBlocked;

  async function run(captured?: string) {
    const current = captured ?? photo;
    if (!current) {
      toast.error("Take your uniform photo first.");
      return;
    }
    setLoading(true);
    setPhotoIssue(null);
    try {
      const referenceImage = await urlToDataUrl(idealUniform);
      const response = await inspect({ data: { guardPhoto: current, referenceImage } });
      if (!response.ok) {
        // Full body / front view not confirmed → submission stays blocked.
        setPhotoBlocked(true);
        setPhotoIssue(FULL_BODY_MESSAGE);
        toast.error(FULL_BODY_MESSAGE);
        return;
      }

      const record: InspectionRecord = {
        id: crypto.randomUUID(),
        branchName: branchName.trim() || "—",
        guardName: guardName.trim() || guardId,
        guardId: guardId.trim(),
        dateTime,
        guardPhoto: current,
        result: response.result,
        comments: "",
        submitted: false,
      };
      // Kept separate from the check itself so a storage failure never reads
      // as "the uniform check failed" — the check succeeded, the save did not.
      try {
        await saveInspection(record);
      } catch (err) {
        console.error("Could not save inspection", err);
        toast.error("Check finished but could not be saved on this device.");
        return;
      }
      navigate({ to: "/results/$id", params: { id: record.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Check failed. Please try again.";
      setPhotoIssue(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {cameraOpen ? (
        <CountdownCamera
          onClose={() => setCameraOpen(false)}
          onCapture={(dataUrl) => {
            setCameraOpen(false);
            setPhotoIssue(null);
            setPhotoBlocked(false);
            setPhoto(dataUrl);
            void run(dataUrl);
          }}
        />
      ) : null}

      <AppHeader
        title="Today's Inspection"
        subtitle={guardName ? `${guardName} · ${guardId}` : undefined}
        action={
          <button
            aria-label="Log out"
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 text-primary-foreground"
          >
            <LogOut className="h-5 w-5" />
          </button>
        }
      />
      <div className="space-y-5 px-4 pt-5">
        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-base font-bold text-foreground">Take your photo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap Capture Photo, place the phone at a distance and stand straight — the photo is taken
            automatically after a 5 second countdown.
          </p>
          {photoIssue ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive"
            >
              {photoIssue}
            </p>
          ) : null}
          {photo ? (
            <>
              <img
                src={photo}
                alt="Your uniform photo"
                className="mt-4 aspect-3/4 w-full rounded-2xl border border-border object-cover"
              />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-14 w-full gap-2 rounded-2xl px-3 text-sm font-semibold transition-transform duration-150 active:scale-[0.97] sm:text-base"
                  onClick={() => setCameraOpen(true)}
                >
                  <RefreshCw className="h-5 w-5 shrink-0" />
                  <span>Retake</span>
                </Button>
                <Button
                  className="h-14 w-full gap-2 rounded-2xl px-3 text-sm font-semibold transition-transform duration-150 active:scale-[0.97] sm:text-base"
                  onClick={() => void run()}
                  disabled={loading}
                >
                  <Check className="h-5 w-5 shrink-0" />
                  <span>Use Photo</span>
                </Button>
              </div>
            </>
          ) : (
            <>
              <BodySilhouetteGuide className="mt-4" />
              <Button
                className="mt-4 h-14 w-full gap-2 rounded-2xl px-3 text-base font-semibold transition-transform duration-150 active:scale-[0.97]"
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="h-5 w-5 shrink-0" />
                <span>Capture Photo</span>
              </Button>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">How your uniform should look</p>
          <img
            src={idealUniform}
            alt="Correct ICICI security guard uniform"
            loading="lazy"
            width={768}
            height={1024}
            className="mt-3 w-full rounded-xl border border-border object-cover"
          />
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">360° Uniform View</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Swipe or tap the arrows to see every side of the correct uniform.
          </p>
          <Guard360 className="mt-3" />
          <Link
            to="/reference"
            className="mt-4 block rounded-xl border border-border py-3 text-center text-sm font-semibold text-primary"
          >
            Open full Uniform Standard Guide
          </Link>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <Button
          onClick={() => void run()}
          disabled={loading || !canCheck}
          className="h-14 w-full text-base font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking your uniform…
            </>
          ) : (
            "Check My Uniform"
          )}
        </Button>
        {!canCheck && !loading ? (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {!photo ? "Capture your uniform photo to continue." : FULL_BODY_MESSAGE}
          </p>
        ) : null}
      </div>
    </div>
  );
}
