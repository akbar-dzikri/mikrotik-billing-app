'use client';

import type { LucideIcon } from 'lucide-react';

interface Stat {
  label: string;
  value: string;
  delta: string;
  tone: string;
  icon: LucideIcon;
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
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
                  s.tone === 'warning'
                    ? 'bg-warning/15 text-warning'
                    : s.tone === 'accent'
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
