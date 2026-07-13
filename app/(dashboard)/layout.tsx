'use client';

import { useSession, signOut } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Routers', href: '/routers' },
  { label: 'Plans', href: '/plans' },
  { label: 'Customers', href: '/customers' },
  { label: 'Vouchers', href: '/vouchers' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] p-6">
          <h2 className="text-lg font-bold text-[var(--fg)]">Billing App</h2>
        </div>

        <nav className="flex-1 p-4">
          <ul className="menu gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                    pathname === item.href
                      ? 'bg-[var(--surface-2)] font-medium text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-[var(--border)] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="flex w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs text-white">
                {session.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
            <div className="text-sm">
              <p className="font-medium text-[var(--fg)]">{session.user?.name || 'User'}</p>
              <p className="text-xs text-[var(--muted)]">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="btn btn-ghost btn-sm w-full text-[var(--muted)] hover:text-[var(--fg)]"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
