import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { currentSession } from "@/lib/auth";
import { issuesOf, loadInspections, type InspectionRecord } from "@/lib/inspection";
import { exportInspectionPdf } from "./results.$id";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — ICICI Guard Uniform Check" },
      {
        name: "description",
        content: "Supervisor reports on the most common uniform issues, with downloadable PDFs.",
      },
      { property: "og:title", content: "Reports — ICICI Guard Uniform Check" },
      {
        property: "og:description",
        content: "Most common uniform issues and downloadable inspection reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InspectionRecord[]>([]);

  useEffect(() => {
    const s = currentSession();
    if (s?.role !== "supervisor") {
      navigate({ to: "/" });
      return;
    }
    setRecords(loadInspections());
  }, [navigate]);

  const counts = new Map<string, number>();
  records.forEach((r) =>
    issuesOf(r.result).forEach((c) => counts.set(c.item, (counts.get(c.item) ?? 0) + 1)),
  );
  const common = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const clean = records.filter((r) => issuesOf(r.result).length === 0).length;

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Reports" back />
      <div className="space-y-5 px-4 pt-5">
        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-card p-5 card-shadow">
            <p className="text-xs text-muted-foreground">Inspections</p>
            <p className="text-2xl font-black text-foreground">{records.length}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 card-shadow">
            <p className="text-xs text-muted-foreground">Fully correct</p>
            <p className="text-2xl font-black text-foreground">{clean}</p>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">Most common issues</p>
          {common.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No issues recorded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {common.map(([item, n]) => (
                <li key={item} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm text-foreground">{item}</span>
                  <span className="text-sm font-bold text-foreground">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">Download reports</p>
          {records.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing to download yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {records.map((r) => (
                <li
                  key={r.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{r.guardName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(r.dateTime).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 shrink-0 font-bold"
                    onClick={() => exportInspectionPdf(r)}
                  >
                    <Download className="mr-2 h-4 w-4" /> PDF
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
