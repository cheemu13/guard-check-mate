import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import idealUniformAsset from "@/assets/ideal-uniform-reference.jpg.asset.json";
const idealUniform = idealUniformAsset.url;
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentUser, logout } from "@/lib/auth";
import { loadInspections } from "@/lib/inspection";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ICICI Security Uniform Inspection" },
      {
        name: "description",
        content: "Set the default branch, review the ideal uniform reference, and clear data.",
      },
      { property: "og:title", content: "Settings — ICICI Security Uniform Inspection" },
      {
        property: "og:description",
        content: "Set the default branch, review the ideal uniform reference, and clear data.",
      },
    ],
  }),
  component: SettingsPage,
});

export const BRANCH_KEY = "icici-default-branch";

function SettingsPage() {
  const navigate = useNavigate();
  const [branch, setBranch] = useState("");
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    setBranch(window.localStorage.getItem(BRANCH_KEY) ?? "");
    setUser(currentUser());
  }, []);

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
          <p className="text-sm font-bold text-foreground">Ideal uniform reference</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This image is sent to the AI alongside each guard photo.
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

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">Account</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Signed in as {user ?? "—"} · {loadInspections().length} saved inspections
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
              toast.success("All local inspections cleared");
            }}
          >
            Clear all inspection data
          </Button>
        </section>
      </div>
    </div>
  );
}
