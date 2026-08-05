import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { currentSession } from "@/lib/auth";

export function AppHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string | undefined;
  back?: boolean | undefined;
  action?: ReactNode | undefined;
}) {
  const router = useRouter();
  const role = typeof window === "undefined" ? null : currentSession()?.role;
  const homeTo = role === "supervisor" ? "/supervisor" : role === "guard" ? "/inspection/new" : "/";
  return (
    <header className="header-gradient sticky top-0 z-20 px-4 pt-[env(safe-area-inset-top)] pb-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pt-4">
        {back ? (
          <button
            aria-label="Go back"
            onClick={() => router.history.back()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-foreground/10 text-primary-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link to={homeTo} className="shrink-0">
            <span className="grid h-10 w-10 place-items-center rounded-full brand-gradient text-sm font-black text-primary-foreground">
              i
            </span>
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-primary-foreground">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-primary-foreground/70">{subtitle}</p>
          ) : null}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </header>
  );
}
