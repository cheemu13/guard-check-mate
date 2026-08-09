import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ImageIcon, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import idealUniform from "@/assets/ideal-uniform-reference.jpg";
import { AppHeader } from "@/components/AppHeader";
import { Guard360 } from "@/components/Guard360";
import { LiveCameraCapture } from "@/components/LiveCameraCapture";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

async function toDataUrl(file: File, maxSize = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

async function urlToDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function NewInspection() {
  const navigate = useNavigate();
  const inspect = useServerFn(inspectUniform);
  const galleryRef = useRef<HTMLInputElement>(null);
  const opened = useRef(false);

  const [branchName, setBranchName] = useState("");
  const [guardName, setGuardName] = useState("");
  const [guardId, setGuardId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoIssue, setPhotoIssue] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

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
    // Open the camera straight away so the guard can start immediately.
    if (!opened.current) {
      opened.current = true;
      window.setTimeout(() => setCameraOpen(true), 350);
    }
  }, [navigate]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoIssue(null);
      setPhoto(await toDataUrl(file));
    } catch {
      toast.error("Could not read that photo. Please try again.");
    }
  }

  const detailsFilled = branchName.trim() !== "" && guardName.trim() !== "";
  const canCheck = detailsFilled && photo !== null;

  async function run() {
    if (!photo) {
      toast.error("Take your uniform photo first.");
      return;
    }
    if (!detailsFilled) {
      toast.error("Fill in your branch and name first.");
      return;
    }
    setLoading(true);
    setPhotoIssue(null);
    try {
      const referenceImage = await urlToDataUrl(idealUniform);
      const result = await inspect({ data: { guardPhoto: photo, referenceImage } });
      const record: InspectionRecord = {
        id: crypto.randomUUID(),
        branchName: branchName.trim() || "—",
        guardName: guardName.trim() || guardId,
        guardId: guardId.trim(),
        dateTime,
        guardPhoto: photo,
        result,
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
          <p className="text-base font-bold text-foreground">
            Step 1 · Take your photo <span className="text-destructive">*</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Stand straight, full body in the frame, front view.
          </p>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
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
                className="mt-4 aspect-3/4 w-full rounded-xl border border-border object-cover"
              />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-13 w-full font-bold"
                  onClick={() => setCameraOpen(true)}
                >
                  <RefreshCw className="mr-2 h-5 w-5" /> Retake
                </Button>
                <Button
                  variant="outline"
                  className="h-13 w-full font-bold"
                  onClick={() => galleryRef.current?.click()}
                >
                  <ImageIcon className="mr-2 h-5 w-5" /> Gallery
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                className="mt-4 h-20 w-full text-base font-bold"
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="mr-2 h-6 w-6" /> Open Camera
              </Button>
              <Button
                variant="outline"
                className="mt-3 h-13 w-full font-bold"
                onClick={() => galleryRef.current?.click()}
              >
                <ImageIcon className="mr-2 h-5 w-5" /> Choose from Gallery
              </Button>
            </>
          )}
        </section>

        <section className="space-y-4 rounded-2xl bg-card p-5 card-shadow">
          <p className="text-base font-bold text-foreground">Step 2 · Your details</p>
          <div className="space-y-2">
            <Label htmlFor="branch">
              Branch <span className="text-destructive">*</span>
            </Label>
            <Input
              id="branch"
              value={branchName}
              required
              aria-required="true"
              maxLength={80}
              onChange={(e) => setBranchName(e.target.value)}
              className="h-13 text-base"
              placeholder="e.g. Bandra West Branch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gname">
              Your Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="gname"
              value={guardName}
              required
              aria-required="true"
              maxLength={80}
              onChange={(e) => setGuardName(e.target.value)}
              className="h-13 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label>Date &amp; Time</Label>
            <div className="flex h-13 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              {dateTime ? new Date(dateTime).toLocaleString() : "—"}
            </div>
          </div>
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
          onClick={run}
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
            {!photo
              ? "Take your uniform photo in Step 1 to continue."
              : "Fill in your branch and name in Step 2 to continue."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
