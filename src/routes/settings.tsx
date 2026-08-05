import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import idealUniformAsset from "@/assets/ideal-uniform-reference.jpg.asset.json";
const idealUniform = idealUniformAsset.url;
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentSession, logout } from "@/lib/auth";
import { loadInspections } from "@/lib/inspection";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ICICI Guard Uniform Check" },
      {
        name: "description",
        content: "Set the default branch, review the uniform reference image and clear stored data.",
      },
      { property: "og:title", content: "Settings — ICICI Guard Uniform Check" },
      {
        property: "og:description",
        content: "Branch defaults, uniform reference image and stored data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

export const BRANCH_KEY = "icici-default-branch";

function SettingsPage() {
  const navigate = useNavigate();
  const [branch, setBranch] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const s = currentSession();
    if (s?.role !== "supervisor") {
      navigate({ to: "/" });
      return;
    }
    setBranch(window.localStorage.getItem(BRANCH_KEY) ?? "");
    setName(s.name);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Settings" back />
      <div className="space-y-5 px-4 pt-5">
        <section className="rounded-2xl bg-card p-5 card-shadow">
          <Label htmlFor="branch">Default branch name</Label>
          <Input
            id="branch"
            value={branch}
            maxLength={80}
            onChange={(e) => setBranch(e.target.value)}
            className="mt-2 h-13 text-base"
            placeholder="e.g. Andheri East Branch"
          />
          <Button
            className="mt-4 h-12 w-full font-bold"
            onClick={() => {
              window.localStorage.setItem(BRANCH_KEY, branch.trim());
              toast.success("Default branch saved");
            }}
          >
            Save
          </Button>
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">Uniform reference image</p>
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
          <p className="text-sm font-bold text-foreground">Account</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supervisor {name || "—"} · {loadInspections().length} stored inspections
          </p>
          <Button
            variant="outline"
            className="mt-4 h-12 w-full font-bold"
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
          >
            Log out
          </Button>
          <Button
            variant="destructive"
            className="mt-3 h-12 w-full font-bold"
            onClick={() => {
              window.localStorage.removeItem("icici-inspections");
              toast.success("All stored inspections cleared");
            }}
          >
            Clear all inspection data
          </Button>
        </section>
      </div>
    </div>
  );
}
