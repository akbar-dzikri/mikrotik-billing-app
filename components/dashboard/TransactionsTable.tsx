'use client';

import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Transaction {
  code: string;
  pkg: string;
  price: string;
  pay: string;
  user: string;
  status: string;
  time: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-card lg:col-span-3">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-foreground">Transaksi Terbaru</div>
          <div className="font-mono text-[11px] text-muted-foreground">auto-refresh · 5 detik</div>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
          Lihat semua <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-5 py-2.5 font-normal">Invoice</th>
              <th className="px-2 py-2.5 font-normal">Paket</th>
              <th className="px-2 py-2.5 font-normal">Harga</th>
              <th className="px-2 py-2.5 font-normal">Metode</th>
              <th className="px-2 py-2.5 font-normal">User</th>
              <th className="px-2 py-2.5 font-normal">Waktu</th>
              <th className="px-5 py-2.5 text-right font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr
                key={t.code}
                className="border-b border-border/40 last:border-0 hover:bg-background/40"
              >
                <td className="px-5 py-3 font-mono text-xs text-foreground">{t.code}</td>
                <td className="px-2 py-3 text-muted-foreground">{t.pkg}</td>
                <td className="px-2 py-3 font-mono text-foreground">{t.price}</td>
                <td className="px-2 py-3 text-muted-foreground">{t.pay}</td>
                <td className="px-2 py-3 font-mono text-xs text-muted-foreground">{t.user}</td>
                <td className="px-2 py-3 font-mono text-xs text-muted-foreground">{t.time}</td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                      t.status === 'sukses'
                        ? 'bg-primary/15 text-primary'
                        : t.status === 'pending'
                          ? 'bg-warning/15 text-warning'
                          : 'bg-destructive/15 text-destructive'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
