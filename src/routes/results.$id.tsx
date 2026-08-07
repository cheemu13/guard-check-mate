import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { jsPDF } from "jspdf";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AnnotatedPhoto } from "@/components/AnnotatedPhoto";
import { VoiceFeedback } from "@/components/VoiceFeedback";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { currentSession } from "@/lib/auth";
import { hindiItem } from "@/lib/voice";
import {
  getInspection,
  issuesOf,
  OVERALL_META,
  STATUS_META,
  type InspectionRecord,
} from "@/lib/inspection";

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Your Checklist — ICICI Guard Uniform Check" },
      {
        name: "description",
        content: "Simple uniform checklist showing what is correct, what needs correction and what is missing.",
      },
      { property: "og:title", content: "Your Checklist — ICICI Guard Uniform Check" },
      {
        property: "og:description",
        content: "See what is correct and what to fix on your uniform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResultsPage,
});

export function exportInspectionPdf(r: InspectionRecord) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFillColor(243, 112, 33);
  doc.rect(0, 0, 595, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(16);
  doc.text("ICICI Guard Uniform Check", margin, 38);
  y = 90;

  doc.setTextColor(40, 40, 40).setFontSize(11).setFont("helvetica", "normal");
  [
    `Guard: ${r.guardName} (${r.guardId})`,
    `Branch: ${r.branchName}`,
    `Date: ${new Date(r.dateTime).toLocaleString()}`,
    `Result: ${OVERALL_META[r.result.overall].label}`,
  ].forEach((line) => {
    doc.text(line, margin, y);
    y += 18;
  });

  y += 10;
  doc.setFont("helvetica", "bold").text("Checklist", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal").setFontSize(10);
  r.result.checklist.forEach((c) => {
    const rec = c.status === "correct" ? "" : ` — ${c.recommendation ?? ""}`;
    doc.text(`- ${c.item}: ${STATUS_META[c.status].label}${rec}`, margin, y, { maxWidth: 515 });
    y += 14;
    if (y > 780) {
      doc.addPage();
      y = margin;
    }
  });

  y += 12;
  doc.setFont("helvetica", "bold").setFontSize(11).text("What to fix", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal").setFontSize(10);
  const list = r.result.recommendations.length ? r.result.recommendations : ["Nothing to fix"];
  list.forEach((i) => {
    const lines = doc.splitTextToSize(`- ${i}`, 515) as string[];
    doc.text(lines, margin, y);
    y += 14 * lines.length;
    if (y > 780) {
      doc.addPage();
      y = margin;
    }
  });

  try {
    doc.addPage();
    doc.setFont("helvetica", "bold").setFontSize(12).text("Guard Photo", margin, margin);
    doc.addImage(r.guardPhoto, "JPEG", margin, margin + 16, 320, 427);
  } catch {
    /* photo optional in PDF */
  }

  doc.save(`uniform-check-${r.guardId}-${r.id.slice(0, 6)}.pdf`);
}

function ResultsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [ready, setReady] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  useEffect(() => {
    setIsSupervisor(currentSession()?.role === "supervisor");
    let active = true;
    getInspection(id).then((found) => {
      if (!active) return;
      setRecord(found ?? null);
      setReady(true);
    });
    return () => {
      active = false;
    };
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
        <AppHeader title="आपकी जाँच सूची" back />
        <div className="px-4 pt-8 text-center">
          <p className="text-sm text-muted-foreground">यह जाँच नहीं मिली।</p>
          <Button asChild className="mt-4 h-12 w-full font-bold">
            <Link to="/">शुरुआत पर जाएँ</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { result } = record;
  const issues = issuesOf(result);

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="आपकी जाँच सूची" subtitle={record.guardName} back />

      <div className="space-y-5 px-4 pt-5">
        <AnnotatedPhoto
          photo={record.guardPhoto}
          alt={`Uniform photo of ${record.guardName}`}
          result={result}
          highlight={highlight}
        />

        <VoiceFeedback
          guardName={record.guardName}
          result={result}
          onHighlight={setHighlight}
        />

        <section className="rounded-2xl bg-card p-5 text-center card-shadow">
          <span
            className={`inline-block rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-wide ${OVERALL_META[result.overall].className}`}
          >
            {result.overall === "all_correct" ? "सब सही है" : "सुधार ज़रूरी है"}
          </span>
          <p className="mt-3 text-sm text-muted-foreground">
            {issues.length === 0
              ? "आज आपकी वर्दी पूरी तरह सही है।"
              : `${issues.length} चीज़ें ठीक करनी हैं।`}
          </p>
        </section>

        {issues.length ? (
          <section className="rounded-2xl border-2 border-warning bg-warning/5 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-foreground">
              क्या ठीक करना है
            </p>
            <ul className="mt-3 space-y-2">
              {issues.map((c) => (
                <li key={c.item} className="flex gap-2 text-sm font-semibold text-foreground">
                  <span>{STATUS_META[c.status].icon}</span>
                  <span>{c.recommendation}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">पूरी जाँच सूची</p>
          <ul className="mt-3 divide-y divide-border">
            {result.checklist.map((c) => (
              <li key={c.item} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{hindiItem(c.item)}</p>
                  {c.status !== "correct" && c.recommendation ? (
                    <p className="text-xs text-muted-foreground">{c.recommendation}</p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 text-right text-xs font-bold ${STATUS_META[c.status].tone}`}
                >
                  {STATUS_META[c.status].icon}{" "}
                  {c.status === "correct"
                    ? "सही"
                    : c.status === "missing"
                      ? "गायब"
                      : "सुधार करें"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {isSupervisor ? (
          <Button
            variant="outline"
            className="h-14 w-full text-base font-bold"
            onClick={() => exportInspectionPdf(record)}
          >
            <Download className="mr-2 h-5 w-5" /> रिपोर्ट डाउनलोड करें
          </Button>
        ) : null}
      </div>

      {isSupervisor ? null : (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
          <Button
            className="h-14 w-full text-base font-bold"
            onClick={() => navigate({ to: "/complete/$id", params: { id: record.id } })}
          >
            आगे बढ़ें
          </Button>
        </div>
      )}
    </div>
  );
}
