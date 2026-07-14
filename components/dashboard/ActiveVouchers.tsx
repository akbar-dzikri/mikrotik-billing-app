'use client';

interface Voucher {
  code: string;
  pkg: string;
  left: string;
}

interface ActiveVouchersProps {
  vouchers: Voucher[];
}

export function ActiveVouchers({ vouchers }: ActiveVouchersProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-card lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-foreground">Voucher Aktif</div>
          <div className="font-mono text-[11px] text-muted-foreground">sinkron mikrotik · users</div>
        </div>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
          {vouchers.length}
        </span>
      </div>
      <ul className="divide-y divide-border/40">
        {vouchers.map((v) => (
          <li key={v.code} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="font-mono text-xs text-foreground">{v.code}</div>
              <div className="font-mono text-[10px] text-muted-foreground">Paket {v.pkg}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-primary">{v.left}</div>
              <div className="font-mono text-[10px] text-muted-foreground">sisa</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
