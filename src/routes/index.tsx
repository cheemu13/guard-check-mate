import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardHat, ShieldCheck } from "lucide-react";
import { IciciLogo } from "@/components/IciciLogo";
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
        setError("Enter your employee ID and 4–6 digit PIN.");
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
      setError("Enter a valid supervisor username and password.");
      return;
    }
    login({ role: "supervisor", id: username.trim(), name: username.trim() });
    navigate({ to: "/supervisor" });
  }

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 pb-10 pt-10">
      <div className="flex items-start justify-between gap-3">
        <IciciLogo className="self-start" />
        <button
          type="button"
          aria-label={role === "supervisor" ? "Back to guard login" : "Supervisor access"}
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
      <div className="mt-8">
        <h1 className="text-2xl font-black text-foreground">
          {role === "guard" ? "Daily Uniform Check" : "Supervisor Sign In"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === "guard" ? "Sign in to start your check." : "View inspections, history and reports."}
        </p>
      </div>


      <form onSubmit={onSubmit} className="mt-7 space-y-5">
        {role === "guard" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="empId">Employee ID</Label>
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
              <Label htmlFor="pin">PIN</Label>
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
              <Label htmlFor="username">Supervisor Username</Label>
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
              <Label htmlFor="password">Password</Label>
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
          {role === "guard" ? "Start Today's Inspection" : "View Inspections"}
        </Button>
      </form>

      <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        ICICI Bank · Security Uniform Check
      </p>
    </main>
  );
}

function RoleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3 text-sm font-bold transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
