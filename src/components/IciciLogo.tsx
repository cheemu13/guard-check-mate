export function IciciLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-2xl font-black text-primary-foreground card-shadow">
        i
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black tracking-tight text-primary">ICICI Bank</p>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Security Inspection
        </p>
      </div>
    </div>
  );
}
