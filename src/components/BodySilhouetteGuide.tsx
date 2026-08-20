/**
 * Static full-body silhouette shown as a framing guide before a photo is taken.
 * Purely presentational — it never crops or zooms the captured image.
 */
export function BodySilhouetteGuide({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="grid aspect-3/4 w-full place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">
        <svg
          viewBox="0 0 100 160"
          aria-hidden="true"
          className="h-full w-auto text-muted-foreground/45"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="50" cy="20" r="11" />
          <path d="M50 31v10" />
          <path d="M31 51c0-5.5 8.5-10 19-10s19 4.5 19 10v34H31z" />
          <path d="M31 53 20 88M69 53l11 35" />
          <path d="M42 85v66M58 85v66" />
          <path d="M36 153h12M52 153h12" />
        </svg>
      </div>
      <p className="px-4 text-center text-sm font-semibold text-muted-foreground">
        कृपया पूरी लंबाई की फ़ोटो लें। कैमरे की ओर मुँह करके ऐसे खड़े हों कि सिर से पैर तक पूरा शरीर फ्रेम में आ जाए।
      </p>
    </div>
  );
}
