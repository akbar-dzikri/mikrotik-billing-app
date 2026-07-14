'use client';

interface RouterInfo {
  name: string;
  load: number;
  users: number;
  status: string;
}

interface RouterHealthProps {
  routers: RouterInfo[];
}

export function RouterHealth({ routers }: RouterHealthProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">Router Mikrotik</div>
          <div className="font-mono text-[11px] text-muted-foreground">status realtime</div>
        </div>
        <span className="font-mono text-[10px] text-primary">{routers.length} aktif</span>
      </div>
      <ul className="mt-5 space-y-3.5">
        {routers.map((r) => (
          <li key={r.name}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    r.status === 'online'
                      ? 'bg-primary shadow-[0_0_6px_1px_var(--color-primary)]'
                      : r.status === 'warning'
                        ? 'bg-warning shadow-[0_0_6px_1px_var(--color-warning)]'
                        : 'bg-destructive shadow-[0_0_6px_1px_var(--color-destructive)]'
                  }`}
                />
                <span className="font-mono text-foreground">{r.name}</span>
              </div>
              <span className="font-mono text-muted-foreground">
                {r.users} user · {r.load}%
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-background">
              <div
                className={`h-full rounded-full ${
                  r.load > 80
                    ? 'bg-gradient-to-r from-warning to-destructive'
                    : 'bg-gradient-to-r from-primary to-accent'
                }`}
                style={{ width: `${r.load}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
