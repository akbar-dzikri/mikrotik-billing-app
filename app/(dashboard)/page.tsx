'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { Wallet, Ticket, Activity, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RouterHealth } from '@/components/dashboard/RouterHealth';
import { TransactionsTable } from '@/components/dashboard/TransactionsTable';

interface DashboardData {
  stats: {
    label: string;
    value: string;
    delta: string;
    tone: 'primary' | 'accent' | 'warning';
  }[];
  transactions: {
    code: string;
    pkg: string;
    price: string;
    pay: string;
    user: string;
    status: string;
    time: string;
  }[];
}

const defaultRouters = [
  { name: 'rt-jaksel-01', load: 72, users: 48, status: 'online' as const },
  { name: 'rt-jaktim-02', load: 44, users: 31, status: 'online' as const },
  { name: 'rt-depok-01', load: 88, users: 39, status: 'online' as const },
  { name: 'rt-bekasi-01', load: 12, users: 9, status: 'warning' as const },
];

const mockSalesData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 60) + 10);

const mockStats = [
  { label: 'Pendapatan Hari Ini', value: 'Rp 0', delta: '0 transaksi', tone: 'primary' as const },
  { label: 'Voucher Terjual', value: '0', delta: 'hari ini', tone: 'primary' as const },
  { label: 'User Online', value: '0', delta: 'live', tone: 'accent' as const },
  { label: 'Router Aktif', value: '0/0', delta: 'online', tone: 'warning' as const },
];

export default function DashboardHome() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'success' && json.data) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || mockStats;
  const salesData = mockSalesData;
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Ringkasan · hari ini
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Selamat datang kembali, {session?.user?.name || 'Admin'}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? 'Memuat data...'
              : `${stats[3]?.value || '0'} router aktif · ${stats[2]?.value || '0'} user online · sistem berjalan normal.`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Wallet className="h-4 w-4" /> Generate Voucher
          </Button>
          <Button size="sm" variant="hero">
            <Activity className="h-4 w-4" /> Buka Storefront
          </Button>
        </div>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid gap-6 xl:grid-cols-3">
        <SalesChart data={salesData} />
        <RouterHealth routers={defaultRouters} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <TransactionsTable transactions={transactions} />
      </div>
    </div>
  );
}
