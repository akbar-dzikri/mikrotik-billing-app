import { Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR, type StorePackage } from "@/lib/storefront/types";

export function PackageCard({
  pkg,
  onSelect,
}: {
  pkg: StorePackage;
  onSelect: (p: StorePackage) => void;
}) {
  const isPopular = pkg.sortOrder === 3;
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 transition-colors ${
        isPopular
          ? "border-primary/50 bg-gradient-to-b from-primary/10 to-transparent shadow-glow"
          : "border-border/70 bg-card/60 hover:border-primary/40"
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-5 rounded-full bg-primary px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary-foreground">
          Populer
        </span>
      )}
      <div className="text-sm font-medium text-muted-foreground">{pkg.name}</div>
      <div className="mt-2 text-2xl font-bold text-foreground">{formatIDR(pkg.priceIdr)}</div>
      <ul className="mt-4 space-y-2 text-sm text-foreground/90">
        <li className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Durasi {pkg.durationLabel}
        </li>
        {pkg.description && (
          <li className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4 text-primary" /> {pkg.description}
          </li>
        )}
      </ul>
      <Button
        className="mt-5"
        variant={isPopular ? "hero" : "outline"}
        onClick={() => onSelect(pkg)}
      >
        Beli sekarang
      </Button>
    </div>
  );
}
