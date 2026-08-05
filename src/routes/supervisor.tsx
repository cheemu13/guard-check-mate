import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, FileText, History, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { currentSession, logout } from "@/lib/auth";
import { loadInspections } from "@/lib/inspection";

export const Route = createFileRoute("/supervisor")({
  head: () => ({
    meta: [
      { title: "Supervisor — ICICI Guard Uniform Check" },
      {
        name: "description",
        content: "Supervisor view of guard uniform inspection results, history and reports.",
      },
      { property: "og:title", content: "Supervisor — ICICI Guard Uniform Check" },
      {
        property: "og:description",
        content: "View guard uniform inspection results, history and reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupervisorHome,
});

function SupervisorHome() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const s = currentSession();
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    if (s.role !== "supervisor") {
      navigate({ to: "/inspection/new" });
      return;
    }
    setName(s.name);
    setCount(loadInspections().length);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader
        title="Supervisor"
        subtitle={name ? `Signed in as ${name}` : undefined}
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
          <p className="text-sm text-muted-foreground">Inspections received</p>
          <p className="text-3xl font-black text-foreground">{count}</p>
        </div>
      </section>

      <nav className="mt-5 space-y-4 px-4">
        <Tile
          to="/history"
          icon={<History className="h-7 w-7" />}
          title="Inspection Results"
          desc="All guard inspections, newest first"
          primary
        />
        <Tile
          to="/reports"
          icon={<FileText className="h-7 w-7" />}
          title="Reports"
          desc="Most common issues and downloadable reports"
        />
        <Tile
          to="/reference"
          icon={<BookOpen className="h-7 w-7" />}
          title="Uniform Standard Guide"
          desc="Correct and incorrect examples for every item"
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
