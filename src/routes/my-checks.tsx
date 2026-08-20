import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { currentSession, logout } from "@/lib/auth";
import { issuesOf, loadInspections, type InspectionRecord } from "@/lib/inspection";

export const Route = createFileRoute("/my-checks")({
  head: () => ({
    meta: [
      { title: "My Past Checks — ICICI Guard Uniform Check" },
      {
        name: "description",
        content: "See your previous daily uniform checks and what you were asked to correct.",
      },
      { property: "og:title", content: "My Past Checks — ICICI Guard Uniform Check" },
      {
        property: "og:description",
        content: "See your previous daily uniform checks and corrections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyChecksPage,
});

function MyChecksPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InspectionRecord[]>([]);

  useEffect(() => {
    const s = currentSession();
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    if (s.role === "supervisor") {
      navigate({ to: "/history" });
      return;
    }
    let active = true;
    loadInspections().then((all) => {
      if (active) setRecords(all.filter((r) => r.guardId === s.id));
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader
        title="मेरी पिछली जाँच"
        action={
          <button
            aria-label="लॉग आउट"
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
      <div className="space-y-4 px-4 pt-5">
        {records.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center card-shadow">
            <p className="text-sm text-muted-foreground">अभी कोई जाँच नहीं है।</p>
          </div>
        ) : (
          records.map((r) => {
            const issues = issuesOf(r.result);
            return (
              <Link
                key={r.id}
                to="/results/$id"
                params={{ id: r.id }}
                className="block rounded-2xl bg-card p-4 card-shadow"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {new Date(r.dateTime).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {issues.length === 0 ? "कुछ ठीक करने को नहीं" : `${issues.length} चीज़ें ठीक करनी हैं`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${OVERALL_META[r.result.overall].className}`}
                  >
                    {r.result.overall === "all_correct" ? "सब सही है" : "सुधार ज़रूरी है"}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <Button asChild className="h-14 w-full text-base font-bold">
          <Link to="/inspection/new">आज की जाँच शुरू करें</Link>
        </Button>
      </div>
    </div>
  );
}
