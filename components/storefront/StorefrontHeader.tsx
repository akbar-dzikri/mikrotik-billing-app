import { Wifi, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { StoreTenant } from "@/lib/storefront/types";

export function StorefrontHeader({ tenant }: { tenant: StoreTenant }) {
  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
        <Link href={`/beli/${tenant.slug}`} className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
            <Wifi className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">{tenant.name}</span>
            <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              /{tenant.slug}
            </span>
          </span>
        </Link>
        {tenant.waSupport && (
          <a
            href={`https://wa.me/${tenant.waSupport.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground sm:inline-flex"
          >
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            Bantuan WA
          </a>
        )}
      </div>
    </header>
  );
}
