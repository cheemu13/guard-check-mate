import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ClipboardCheck, History, LogOut, Settings, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { currentUser, logout } from "@/lib/auth";
import { loadInspections } from "@/lib/inspection";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — ICICI Security Uniform Inspection" },
      {
        name: "description",
        content: "Start a new guard uniform inspection, review history, or adjust settings.",
      },
      { property: "og:title", content: "Home — ICICI Security Uniform Inspection" },
      {
        property: "og:description",
        content: "Start a new guard uniform inspection, review history, or adjust settings.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const u = currentUser();
    if (!u) navigate({ to: "/" });
    setUser(u);
    setCount(loadInspections().length);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader
        title="ICICI Security Inspection"
        subtitle={user ? `Signed in as ${user}` : undefined}
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

      <section className="px-4 pt-5">
        <div className="rounded-2xl bg-card p-5 card-shadow">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Inspections recorded</p>
              <p className="text-3xl font-black text-foreground">{count}</p>
            </div>
          </div>
        </div>
      </section>

      <nav className="mt-5 space-y-4 px-4">
        <Tile
          to="/inspection/new"
          icon={<ClipboardCheck className="h-7 w-7" />}
          title="Start New Inspection"
          desc="Capture a guard photo and run the AI uniform check"
          primary
        />
        <Tile
          to="/history"
          icon={<History className="h-7 w-7" />}
          title="Inspection History"
          desc="View and export past inspections"
        />
        <Tile
          to="/settings"
          icon={<Settings className="h-7 w-7" />}
          title="Settings"
          desc="Branch defaults, reference image and data"
        />
      </nav>
    </div>
  );
}

function Tile({
  to,
  icon,
  title,
  desc,
  primary,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex min-h-20 items-center gap-4 rounded-2xl p-5 card-shadow transition-transform active:scale-[0.98] ${
        primary ? "brand-gradient text-primary-foreground" : "bg-card text-card-foreground"
      }`}
    >
      <span className={primary ? "shrink-0" : "shrink-0 text-primary"}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-lg font-bold">{title}</span>
        <span className={`block text-sm ${primary ? "opacity-90" : "text-muted-foreground"}`}>
          {desc}
        </span>
      </span>
    </Link>
  );
}
