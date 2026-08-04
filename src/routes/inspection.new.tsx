import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import idealUniform from "@/assets/ideal-uniform.jpg";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentUser } from "@/lib/auth";
import { inspectUniform } from "@/lib/inspect.functions";
import { saveInspection, type InspectionRecord } from "@/lib/inspection";
import { BRANCH_KEY } from "./settings";

export const Route = createFileRoute("/inspection/new")({
  head: () => ({
    meta: [
      { title: "New Inspection — ICICI Security Uniform Inspection" },
      {
        name: "description",
        content:
          "Capture guard details and a photo, then run an AI uniform comparison against the ideal reference.",
      },
      { property: "og:title", content: "New Inspection — ICICI Security Uniform Inspection" },
      {
        property: "og:description",
        content: "Capture a guard photo and run the AI uniform compliance check.",
      },
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
  const fileRef = useRef<HTMLInputElement>(null);

  const [branchName, setBranchName] = useState("");
  const [guardName, setGuardName] = useState("");
  const [guardId, setGuardId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser()) navigate({ to: "/" });
    setBranchName(window.localStorage.getItem(BRANCH_KEY) ?? "");
    setDateTime(new Date().toISOString());
  }, [navigate]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await toDataUrl(file));
    } catch {
      toast.error("Could not read that photo. Please try again.");
    }
  }

  async function run() {
    if (!branchName.trim() || !guardName.trim() || !guardId.trim()) {
      toast.error("Please fill in branch, guard name and guard ID.");
      return;
    }
    if (!photo) {
      toast.error("Capture the guard photo first.");
      return;
    }
    setLoading(true);
    try {
      const referenceImage = await urlToDataUrl(idealUniform);
      const result = await inspect({ data: { guardPhoto: photo, referenceImage } });
      const record: InspectionRecord = {
        id: crypto.randomUUID(),
        branchName: branchName.trim(),
        guardName: guardName.trim(),
        guardId: guardId.trim(),
        dateTime,
        guardPhoto: photo,
        result,
        comments: "",
        submitted: false,
      };
      saveInspection(record);
      navigate({ to: "/results/$id", params: { id: record.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Inspection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="New Inspection" back />
      <div className="space-y-5 px-4 pt-5">
        <section className="space-y-4 rounded-2xl bg-card p-5 card-shadow">
          <div className="space-y-2">
            <Label htmlFor="branch">Branch Name</Label>
            <Input
              id="branch"
              value={branchName}
              maxLength={80}
              onChange={(e) => setBranchName(e.target.value)}
              className="h-13 text-base"
              placeholder="e.g. Bandra West Branch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gname">Guard Name</Label>
            <Input
              id="gname"
              value={guardName}
              maxLength={80}
              onChange={(e) => setGuardName(e.target.value)}
              className="h-13 text-base"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gid">Guard ID</Label>
            <Input
              id="gid"
              value={guardId}
              maxLength={40}
              onChange={(e) => setGuardId(e.target.value)}
              className="h-13 text-base"
              placeholder="e.g. SG-10428"
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
          <p className="text-sm font-bold text-foreground">Guard Photo</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPick}
          />
          {photo ? (
            <>
              <img
                src={photo}
                alt="Captured guard photo"
                className="mt-3 aspect-3/4 w-full rounded-xl border border-border object-cover"
              />
              <Button
                variant="outline"
                className="mt-3 h-13 w-full font-bold"
                onClick={() => fileRef.current?.click()}
              >
                <RefreshCw className="mr-2 h-5 w-5" /> Retake Photo
              </Button>
            </>
          ) : (
            <Button
              className="mt-3 h-20 w-full text-base font-bold"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="mr-2 h-6 w-6" /> Capture Guard Photo
            </Button>
          )}
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">Ideal Uniform Reference</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The AI compares the guard photo against this standard.
          </p>
          <img
            src={idealUniform}
            alt="Ideal ICICI security guard uniform reference"
            loading="lazy"
            width={768}
            height={1024}
            className="mt-3 w-full rounded-xl border border-border object-cover"
          />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <Button onClick={run} disabled={loading} className="h-14 w-full text-base font-bold">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Inspecting uniform…
            </>
          ) : (
            "Inspect Uniform"
          )}
        </Button>
      </div>
    </div>
  );
}
