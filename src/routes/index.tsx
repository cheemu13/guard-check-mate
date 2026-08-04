import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IciciLogo } from "@/components/IciciLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentUser, login } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — ICICI Security Uniform Inspection" },
      {
        name: "description",
        content:
          "Supervisor login for the ICICI Bank security guard uniform inspection app with AI photo checks.",
      },
      { property: "og:title", content: "Login — ICICI Security Uniform Inspection" },
      {
        property: "og:description",
        content: "Supervisor login for AI-assisted ICICI security guard uniform inspections.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser()) navigate({ to: "/home" });
  }, [navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().length < 3 || password.length < 4) {
      setError("Enter a valid username and password (min 4 characters).");
      return;
    }
    login(username.trim());
    navigate({ to: "/home" });
  }

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 pb-10 pt-16">
      <IciciLogo />
      <div className="mt-10">
        <h1 className="text-2xl font-black text-foreground">Supervisor Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to inspect guard uniforms at your branch.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
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
        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        <Button type="submit" className="h-14 w-full text-base font-bold">
          Login
        </Button>
      </form>

      <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        ICICI Bank · Security Uniform Compliance
      </p>
    </main>
  );
}
