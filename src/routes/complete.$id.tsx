import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  getInspection,
  issuesOf,
  saveInspection,
  STATUS_META,
  type InspectionRecord,
} from "@/lib/inspection";

export const Route = createFileRoute("/complete/$id")({
  head: () => ({
    meta: [
      { title: "Inspection Complete — ICICI Guard Uniform Check" },
      {
        name: "description",
        content: "Review what to fix and submit today's uniform inspection to your supervisor.",
      },
      { property: "og:title", content: "Inspection Complete — ICICI Guard Uniform Check" },
      {
        property: "og:description",
        content: "Submit today's uniform inspection to your supervisor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompletePage,
});

function CompletePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
        <AppHeader title="जाँच पूरी हुई" back />
        <div className="px-4 pt-8 text-center">
          <p className="text-sm text-muted-foreground">यह जाँच नहीं मिली।</p>
          <Button asChild className="mt-4 h-12 w-full font-bold">
            <Link to="/inspection/new">आज की जाँच शुरू करें</Link>
          </Button>
        </div>
      </div>
    );
  }

  const issues = issuesOf(record.result);

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="जाँच पूरी हुई" back />

      <div className="space-y-5 px-4 pt-6">
        <section className="rounded-2xl bg-card p-6 text-center card-shadow">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h2 className="mt-3 text-xl font-black text-foreground">जाँच पूरी हुई</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {record.guardName} · {new Date(record.dateTime).toLocaleString()}
          </p>
          {record.submitted ? (
            <p className="mt-3 text-sm font-bold text-success">आपके सुपरवाइज़र को भेज दी गई</p>
          ) : null}
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <p className="text-sm font-bold text-foreground">
            {issues.length === 0 ? "सब कुछ सही है" : "ये चीज़ें ठीक करें"}
          </p>
          {issues.length === 0 ? (
            <p className="mt-2 text-sm text-success">आज आपकी वर्दी नियम के अनुसार सही है।</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {issues.map((c) => (
                <li key={c.item} className="flex gap-2 text-sm font-semibold text-foreground">
                  <span>{STATUS_META[c.status].icon}</span>
                  <span>{c.recommendation}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Button asChild variant="outline" className="h-13 w-full font-bold">
          <Link to="/results/$id" params={{ id: record.id }}>
            पूरी जाँच सूची देखें
          </Link>
        </Button>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
        <Button
          className="h-14 w-full text-base font-bold"
          disabled={record.submitted}
          onClick={async () => {
            const submitted = { ...record, submitted: true };
            try {
              await saveInspection(submitted);
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "जमा नहीं हो सका। कृपया फिर कोशिश करें।",
              );
              return;
            }
            setRecord(submitted);
            toast.success("जाँच जमा हो गई");
            navigate({ to: "/my-checks" });
          }}
        >
          {record.submitted ? "जमा हो गई" : "सबमिट करें"}
        </Button>
      </div>
    </div>
  );
}
