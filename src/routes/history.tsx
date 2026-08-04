import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  deleteInspection,
  loadInspections,
  OVERALL_META,
  type InspectionRecord,
} from "@/lib/inspection";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Inspection History — ICICI Security Uniform Inspection" },
      {
        name: "description",
        content: "Browse saved ICICI security guard uniform inspections with scores and results.",
      },
      { property: "og:title", content: "Inspection History — ICICI Security Uniform Inspection" },
      {
        property: "og:description",
        content: "Browse saved ICICI security guard uniform inspections with scores and results.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  useEffect(() => setRecords(loadInspections()), []);

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Inspection History" back />
      <div className="space-y-4 px-4 pt-5">
        {records.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center card-shadow">
            <p className="text-sm text-muted-foreground">No inspections saved yet.</p>
            <Button asChild className="mt-4 h-12 w-full font-bold">
              <Link to="/inspection/new">Start New Inspection</Link>
            </Button>
          </div>
        ) : (
          records.map((r) => (
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
                    <p className="mt-1 text-lg font-black text-foreground">{r.result.score}%</p>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => {
                  deleteInspection(r.id);
                  setRecords(loadInspections());
                }}
                className="mt-3 text-xs font-semibold text-destructive"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
