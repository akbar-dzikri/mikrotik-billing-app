import Link from 'next/link';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="group inline-flex items-center gap-2.5">
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent shadow-glow">
        <span className="absolute inset-0.5 rounded-[5px] bg-background/80" />
        <span className="relative font-mono text-[13px] font-bold text-primary">A</span>
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_2px_var(--color-primary)]" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            ARNET<span className="text-primary">.</span>
          </span>
          <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            billing/v1
          </span>
        </span>
      )}
    </Link>
  );
}
