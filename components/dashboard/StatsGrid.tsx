'use client';

import { Wallet, Ticket, Activity, Wifi } from 'lucide-react';

const iconMap: Record<string, typeof Wallet> = {
  primary: Wallet,
  accent: Activity,
  warning: Wifi,
};

interface Stat {
  label: string;
  value: string;
  delta: string;
  tone?: 'primary' | 'accent' | 'warning';
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  const icons = [Wallet, Ticket, Activity, Wifi];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((s, i) => {
        const Icon = icons[i] || Wallet;
        const tone = s.tone || 'primary';
        return (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                  tone === 'warning'
                    ? 'bg-warning/15 text-warning'
                    : tone === 'accent'
                      ? 'bg-accent/15 text-accent'
                      : 'bg-primary/15 text-primary'
                }`}
              >
                {s.delta}
              </span>
            </div>
            <div className="mt-4 font-mono text-2xl font-semibold tracking-tight text-foreground">
              {s.value}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>
        );
      })}
    </div>
  );
}
