'use client';

interface SalesChartProps {
  data: number[];
}

export function SalesChart({ data }: SalesChartProps) {
  const maxChart = Math.max(...data, 1);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 xl:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">Penjualan Voucher</div>
          <div className="font-mono text-[11px] text-muted-foreground">24 jam terakhir · per jam</div>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-background p-1">
          {['24H', '7D', '30D'].map((t, i) => (
            <button
              key={t}
              className={`rounded px-2.5 py-1 font-mono text-[10px] ${
                i === 0 ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 flex h-52 items-end gap-1.5">
        {data.map((v, i) => (
          <div key={i} className="flex-1">
            <div
              className="rounded-t-sm bg-gradient-to-t from-primary/40 to-primary transition-all hover:from-primary/60 hover:to-accent"
              style={{ height: `${(v / maxChart) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}
