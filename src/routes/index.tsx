import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentSession, login, type Role } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — ICICI Guard Uniform Check" },
      {
        name: "description",
        content:
          "Security guards sign in with employee ID and PIN to run the daily uniform check. Supervisors sign in to view results.",
      },
      { property: "og:title", content: "Login — ICICI Guard Uniform Check" },
      {
        property: "og:description",
        content: "Guard and supervisor login for the ICICI daily uniform check.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("guard");
  const [empId, setEmpId] = useState("");
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const s = currentSession();
    if (s?.role === "guard") navigate({ to: "/inspection/new" });
    if (s?.role === "supervisor") navigate({ to: "/supervisor" });
  }, [navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (role === "guard") {
      if (empId.trim().length < 3 || !/^\d{4,6}$/.test(pin)) {
        setError("अपना कर्मचारी आईडी और 4–6 अंकों का पिन डालें।");
        return;
      }
      login({
        role: "guard",
        id: empId.trim().toUpperCase(),
        name: empId.trim().toUpperCase(),
      });
      navigate({ to: "/inspection/new" });
      return;
    }
    if (username.trim().length < 3 || password.length < 4) {
      setError("सही सुपरवाइज़र यूज़रनेम और पासवर्ड डालें।");
      return;
    }
    login({ role: "supervisor", id: username.trim(), name: username.trim() });
    navigate({ to: "/supervisor" });
  }

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 pb-10 pt-10">
      <div className="flex justify-end">
        <button
          type="button"
          aria-label={role === "supervisor" ? "गार्ड लॉगिन पर वापस जाएँ" : "सुपरवाइज़र लॉगिन"}
          aria-pressed={role === "supervisor"}
          onClick={() => {
            setError("");
            setRole(role === "supervisor" ? "guard" : "supervisor");
          }}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors ${
            role === "supervisor"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          <ShieldCheck className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-10 text-center">
        <h1 className="text-3xl font-black text-foreground">
          {role === "guard" ? "Uniform CheckMate" : "सुपरवाइज़र लॉगिन"}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          {role === "guard"
            ? "जाँच शुरू करने के लिए लॉगिन करें।"
            : "जाँच, इतिहास और रिपोर्ट देखें।"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-7 space-y-5">
        {role === "guard" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="empId">कर्मचारी आईडी</Label>
              <Input
                id="empId"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="e.g. SG-10428"
                className="h-14 text-base"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">पिन</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="h-14 text-base tracking-widest"
                maxLength={6}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="username">सुपरवाइज़र यूज़रनेम</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="supervisor.id"
                className="h-14 text-base"
                maxLength={64}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">पासवर्ड</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-14 text-base"
                maxLength={64}
              />
            </div>
          </>
        )}

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        <Button type="submit" className="h-14 w-full text-base font-bold">
          {role === "guard" ? "आज की जाँच शुरू करें" : "जाँच देखें"}
        </Button>
      </form>

      <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        आईसीआईसीआई बैंक · वर्दी जाँच
      </p>
    </main>
  );
}
