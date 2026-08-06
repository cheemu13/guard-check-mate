import iciciBanner from "@/assets/icici-bank-banner.png.asset.json";

export function IciciLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start gap-2.5 ${className}`}>
      <img
        src={iciciBanner.url}
        alt="ICICI Bank"
        className="h-14 w-full max-w-[320px] rounded-md object-contain"
      />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Security Inspection
      </p>
    </div>
  );
}
