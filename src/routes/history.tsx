import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { currentSession } from "@/lib/auth";
import {
  deleteInspection,
  issuesOf,
  loadInspections,
  OVERALL_META,
  type InspectionRecord,
} from "@/lib/inspection";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Inspection Results — ICICI Guard Uniform Check" },
      {
        name: "description",
        content: "All submitted guard uniform inspections with their checklist outcome.",
      },
      { property: "og:title", content: "Inspection Results — ICICI Guard Uniform Check" },
      {
        property: "og:description",
        content: "All submitted guard uniform inspections with their checklist outcome.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    setIsSupervisor(currentSession()?.role === "supervisor");
    let active = true;
    loadInspections().then((all) => {
      if (active) setRecords(all);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Inspection Results" back />
      <div className="space-y-4 px-4 pt-5">
        {records.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center card-shadow">
            <p className="text-sm text-muted-foreground">No inspections yet.</p>
          </div>
        ) : (
          records.map((r) => {
            const issues = issuesOf(r.result);
            return (
              <div key={r.id} className="rounded-2xl bg-card p-4 card-shadow">
                <Link to="/results/$id" params={{ id: r.id }} className="block">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-foreground">{r.guardName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.guardId} · {r.branchName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(r.dateTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${OVERALL_META[r.result.overall].className}`}
                      >
                        {OVERALL_META[r.result.overall].label}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {issues.length === 0 ? "No issues" : `${issues.length} to fix`}
                      </p>
                      {r.submitted ? (
                        <p className="text-xs font-semibold text-success">Submitted</p>
                      ) : null}
                    </div>
                  </div>
                </Link>
                {isSupervisor ? (
                  <button
                    onClick={async () => {
                      try {
                        await deleteInspection(r.id);
                      } catch {
                        toast.error("Could not delete this inspection.");
                      }
                      setRecords(await loadInspections());
                    }}
                    className="mt-3 text-xs font-semibold text-destructive"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            );
          })
        )}
        {isSupervisor ? null : (
          <Button asChild className="h-13 w-full font-bold">
            <Link to="/inspection/new">Start Today's Inspection</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
