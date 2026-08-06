import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Guard360 } from "@/components/Guard360";

import idealUniform from "@/assets/ideal-uniform-reference.jpg";
import { CHECKLIST_SPECS } from "@/lib/inspection";
import { REFERENCE_GROUPS } from "@/lib/reference-images";

export const Route = createFileRoute("/reference")({
  head: () => ({
    meta: [
      { title: "Uniform Standard Guide — ICICI Security Uniform Inspection" },
      {
        name: "description",
        content:
          "Pass and fail photo examples for every uniform item, the 13-point checklist criteria and auto-fail rules.",
      },
      { property: "og:title", content: "Uniform Standard Guide — ICICI Security Inspection" },
      {
        property: "og:description",
        content: "Pass and fail photo examples for every guard uniform item.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReferencePage,
});

function ReferencePage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title="Uniform Standard Guide" back />
      <div className="space-y-5 px-4 pt-5">
        <section className="rounded-2xl bg-card p-5 card-shadow">
          <h2 className="text-sm font-bold text-foreground">Ideal Uniform Reference</h2>
          <img
            src={idealUniform}
            alt="Ideal ICICI security guard uniform reference"
            loading="lazy"
            className="mt-3 w-full rounded-xl border border-border"
          />
        </section>

        <section className="rounded-2xl bg-card p-5 card-shadow">
          <h2 className="text-sm font-bold text-foreground">360° Uniform View</h2>
          <Guard360 className="mt-3" />
        </section>


        <section className="rounded-2xl bg-card p-5 card-shadow">
          <h2 className="text-sm font-bold text-foreground">13-Point Checklist</h2>
          <ul className="mt-3 divide-y divide-border">
            {CHECKLIST_SPECS.map((s) => (
              <li key={s.item} className="py-3">
                <p className="text-sm font-semibold text-foreground">
                  {s.item}
                </p>
                <p className="mt-1 text-xs text-success">✅ {s.pass}</p>
                <p className="text-xs text-destructive">❌ {s.fail}</p>
              </li>
            ))}
          </ul>
        </section>

        {REFERENCE_GROUPS.map((group) => (
          <section key={group.category} className="rounded-2xl bg-card p-5 card-shadow">
            <h2 className="text-sm font-bold text-foreground">{group.category}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {group.examples.map((ex) => (
                <figure key={ex.url} className="overflow-hidden rounded-xl border border-border">
                  <img
                    src={ex.url}
                    alt={ex.label}
                    loading="lazy"
                    className="aspect-3/4 w-full object-cover"
                  />
                  <figcaption
                    className={`px-2 py-2 text-[11px] font-semibold ${
                      ex.verdict === "pass"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {ex.verdict === "pass" ? "✅ " : "❌ "}
                    {ex.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
