import iciciBankLogo from "@/assets/icici-bank-logo.jpg";

export function IciciLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <img
        src={iciciBankLogo}
        alt="ICICI Bank"
        className="h-12 w-auto max-w-[220px] rounded-md object-contain card-shadow"
      />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Security Inspection
      </p>
    </div>
  );
}
