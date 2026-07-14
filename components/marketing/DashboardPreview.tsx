import { Activity, Router, Ticket, Wallet } from "lucide-react";

const salesData = [12, 18, 15, 22, 28, 24, 32, 38, 34, 42, 48, 45, 52, 60, 55, 62, 70, 66, 74, 80];
const maxSale = Math.max(...salesData);

export function DashboardPreview() {
  return (
    <div className="relative rounded-xl border border-border/80 bg-card/90 p-4 shadow-card backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
        </div>
        <div className="rounded-md border border-border/60 bg-background/60 px-3 py-1 font-mono text-[10px] text-muted-foreground">
          app.arnet.id/dashboard
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_6px_1px_var(--color-primary)]" />
          LIVE
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Wallet, label: "Pendapatan Hari Ini", value: "Rp 2.480K", delta: "+18%" },
          { icon: Ticket, label: "Voucher Terjual", value: "342", delta: "+24" },
          { icon: Activity, label: "User Online", value: "127", delta: "live" },
          { icon: Router, label: "Router Aktif", value: "4/4", delta: "OK" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border/60 bg-background/60 p-3">
            <div className="flex items-center justify-between">
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-[10px] text-primary">{s.delta}</span>
            </div>
            <div className="mt-2 font-mono text-lg font-semibold text-foreground">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border/60 bg-background/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-foreground">Penjualan Voucher · 24 Jam</div>
            <div className="font-mono text-[10px] text-muted-foreground">tick = 1 jam</div>
          </div>
          <div className="flex gap-1">
            {["1H", "24H", "7D", "30D"].map((t, i) => (
              <span
                key={t}
                className={`rounded px-2 py-0.5 font-mono text-[10px] ${
                  i === 1 ? "bg-primary/15 text-primary" : "text-muted-foreground"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex h-24 items-end gap-1">
          {salesData.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-primary/60 to-primary"
              style={{
                height: `${(v / maxSale) * 100}%`,
                opacity: 0.4 + (i / salesData.length) * 0.6,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border/60 bg-background/60">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <div className="text-xs font-medium text-foreground">Transaksi Terbaru</div>
          <span className="font-mono text-[10px] text-muted-foreground">auto-refresh 5s</span>
        </div>
        {[
          { code: "VCR-8A21", pkg: "Paket 1 Hari", price: "Rp 5.000", pay: "QRIS", status: "sukses" },
          { code: "VCR-8A20", pkg: "Paket 7 Hari", price: "Rp 25.000", pay: "Midtrans", status: "sukses" },
          { code: "VCR-8A19", pkg: "Paket 30 Hari", price: "Rp 75.000", pay: "QRIS", status: "pending" },
        ].map((t) => (
          <div
            key={t.code}
            className="grid grid-cols-5 items-center gap-2 border-b border-border/40 px-4 py-2.5 text-xs last:border-0"
          >
            <span className="font-mono text-foreground">{t.code}</span>
            <span className="text-muted-foreground">{t.pkg}</span>
            <span className="font-mono text-foreground">{t.price}</span>
            <span className="text-muted-foreground">{t.pay}</span>
            <span
              className={`justify-self-end rounded-full px-2 py-0.5 font-mono text-[10px] ${
                t.status === "sukses"
                  ? "bg-primary/15 text-primary"
                  : "bg-warning/15 text-warning"
              }`}
            >
              {t.status}
            </span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute -left-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-border bg-card px-3 py-2 shadow-glow md:block">
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          mikrotik
        </div>
        <div className="font-mono text-xs text-primary">RouterOS 7.14 · OK</div>
      </div>
      <div className="pointer-events-none absolute -right-4 top-8 hidden rounded-lg border border-border bg-card px-3 py-2 shadow-glow md:block">
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          webhook
        </div>
        <div className="font-mono text-xs text-accent">midtrans.settlement</div>
      </div>
    </div>
  );
}
