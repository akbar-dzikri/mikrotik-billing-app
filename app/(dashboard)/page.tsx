'use client';

import { useSession } from '@/lib/auth-client';

export default function DashboardHome() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--fg)]">Dashboard</h1>
        <p className="mt-1 text-[var(--muted)]">
          Welcome back, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat cards */}
        {[
          { label: 'Routers', value: '—' },
          { label: 'Plans', value: '—' },
          { label: 'Customers', value: '—' },
          { label: 'Online', value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="card border border-[var(--border)] bg-[var(--surface)]">
            <div className="card-body p-5">
              <p className="text-sm text-[var(--muted)]">{stat.label}</p>
              <p className="text-3xl font-bold text-[var(--fg)]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
