import iciciBankLogo from "@/assets/icici-bank-logo.png";

export function IciciLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start gap-2.5 ${className}`}>
      <img
        src={iciciBankLogo}
        alt="ICICI Bank"
        className="h-12 w-auto rounded-md object-contain"
      />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Security Inspection
      </p>
    </div>
  );
}
