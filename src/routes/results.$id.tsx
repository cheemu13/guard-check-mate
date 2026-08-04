import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { jsPDF } from "jspdf";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getInspection,
  OVERALL_META,
  saveInspection,
  STATUS_META,
  type InspectionRecord,
} from "@/lib/inspection";

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Inspection Result — ICICI Security Uniform Inspection" },
      {
        name: "description",
        content:
          "AI uniform inspection result with checklist, critical issues, score and PDF export.",
      },
      { property: "og:title", content: "Inspection Result — ICICI Security Uniform Inspection" },
      {
        property: "og:description",
        content: "AI uniform inspection result with checklist, critical issues and score.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [comments, setComments] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const r = getInspection(id);
    setRecord(r ?? null);
    setComments(r?.comments ?? "");
    setReady(true);
  }, [id]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Inspection Result" back />
        <div className="px-4 pt-8 text-center">
          <p className="text-sm text-muted-foreground">This inspection could not be found.</p>
          <Button asChild className="mt-4 h-12 w-full font-bold">
            <Link to="/home">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { result } = record;

  function exportPdf(r: InspectionRecord) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = margin;

    doc.setFillColor(243, 112, 33);
    doc.rect(0, 0, 595, 60, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold").setFontSize(16);
    doc.text("ICICI Security Uniform Inspection", margin, 38);
    y = 90;

    doc.setTextColor(40, 40, 40).setFontSize(11).setFont("helvetica", "normal");
    const meta = [
      `Guard: ${r.guardName} (${r.guardId})`,
      `Branch: ${r.branchName}`,
      `Date: ${new Date(r.dateTime).toLocaleString()}`,
      `Overall: ${OVERALL_META[r.result.overall].label}   |   Score: ${r.result.score}%`,
    ];
    meta.forEach((line) => {
      doc.text(line, margin, y);
      y += 18;
    });

    y += 10;
    doc.setFont("helvetica", "bold").text("Checklist", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal").setFontSize(10);
    r.result.checklist.forEach((c) => {
      const label = STATUS_META[c.status].label;
      doc.text(`- ${c.item}: ${label}${c.note ? ` (${c.note})` : ""}`, margin, y, {
        maxWidth: 515,
      });
      y += 14;
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
    });

    y += 12;
    doc.setFont("helvetica", "bold").setFontSize(11).text("Critical Issues", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal").setFontSize(10);
    const issues = r.result.criticalIssues.length ? r.result.criticalIssues : ["None reported"];
    issues.forEach((i) => {
      const lines = doc.splitTextToSize(`- ${i}`, 515) as string[];
      doc.text(lines, margin, y);
      y += 14 * lines.length;
    });

    y += 12;
    doc.setFont("helvetica", "bold").setFontSize(11).text("Summary", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal").setFontSize(10);
    const summary = doc.splitTextToSize(r.result.summary || "—", 515) as string[];
    doc.text(summary, margin, y);
    y += 14 * summary.length + 12;

    doc.setFont("helvetica", "bold").setFontSize(11).text("Supervisor Comments", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal").setFontSize(10);
    const cmt = doc.splitTextToSize(r.comments || "—", 515) as string[];
    doc.text(cmt, margin, y);

    try {
      doc.addPage();
      doc.setFont("helvetica", "bold").setFontSize(12).text("Guard Photo", margin, margin);
      doc.addImage(r.guardPhoto, "JPEG", margin, margin + 16, 320, 427);
    } catch {
      /* photo optional in PDF */
    }

    doc.save(`inspection-${r.guardId}-${r.id.slice(0, 6)}.pdf`);
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="Inspection Result" subtitle={record.guardName} back />

      <div className="space-y-5 px-4 pt-5">
        <section className="rounded-2xl bg-card p-5 text-center card-shadow">
          <span
            className={`inline-block rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-wide ${OVERALL_META[result.overall].className}`}
          >
            {OVERALL_META[result.overall].label}
          </span>
          <p className="mt-4 text-5xl font-black text-foreground">{result.score}%</p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Inspection Score
          </p>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full brand-gradient transition-all"
              style={{ width: `${result.score}%` }}
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {record.branchName} · {record.guardId} · {new Date(record.dateTime).toLocaleString()}
          </p>
        </section>

        {result.autoFailReasons?.length ? (
          <section className="rounded-2xl border-2 border-destructive bg-destructive/5 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-destructive">
              Auto-Fail Triggered
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {result.autoFailReasons.map((i) => (
                <li key={i} className="text-sm font-semibold text-destructive">
                  {i}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">Checklist</p>
          <ul className="mt-3 divide-y divide-border">
            {result.checklist.map((c) => (
              <li key={c.item} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {c.item}
                    {c.criticality ? (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {c.criticality}
                      </span>
                    ) : null}
                  </p>
                  {c.note ? <p className="text-xs text-muted-foreground">{c.note}</p> : null}
                </div>
                <span
                  className={`shrink-0 text-right text-xs font-bold ${STATUS_META[c.status].tone}`}
                >
                  {STATUS_META[c.status].icon} {STATUS_META[c.status].label}
                </span>
              </li>
            ))}
          </ul>
        </section>


        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">Critical Issues</p>
          {result.criticalIssues.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {result.criticalIssues.map((i) => (
                <li key={i} className="text-sm text-destructive">
                  {i}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-success">No critical issues found.</p>
          )}
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">Summary</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <Label htmlFor="comments">Supervisor Comments</Label>
          <Textarea
            id="comments"
            value={comments}
            maxLength={1000}
            onChange={(e) => setComments(e.target.value)}
            className="mt-2 min-h-28 text-base"
            placeholder="Add observations or corrective action taken…"
          />
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">Guard Photo</p>
          <img
            src={record.guardPhoto}
            alt={`Uniform photo of ${record.guardName}`}
            loading="lazy"
            className="mt-3 aspect-3/4 w-full rounded-xl border border-border object-cover"
          />
        </section>

        <Button
          variant="outline"
          className="h-14 w-full text-base font-bold"
          onClick={() => exportPdf({ ...record, comments })}
        >
          <Download className="mr-2 h-5 w-5" /> Export as PDF
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <Button
          className="h-14 w-full text-base font-bold"
          onClick={() => {
            saveInspection({ ...record, comments, submitted: true });
            toast.success("Inspection submitted and saved");
            navigate({ to: "/history" });
          }}
        >
          Submit Inspection
        </Button>
      </div>
    </div>
  );
}
