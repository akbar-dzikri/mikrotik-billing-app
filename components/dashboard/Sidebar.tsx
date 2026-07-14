'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Router,
  CreditCard,
  Users,
  Ticket,
  Settings,
  Wifi,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/dashboard/Logo';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth-client';

const navItems = [
  { label: 'Ringkasan', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Routers', icon: Router, href: '/routers' },
  { label: 'Plans', icon: CreditCard, href: '/plans' },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Vouchers', icon: Ticket, href: '/vouchers' },
  { label: 'Tenants', icon: Settings, href: '/storefront/tenants' },
  { label: 'Orders', icon: Wifi, href: '/storefront/orders' },
];

interface SidebarProps {
  currentPath: string;
}

export function Sidebar({ currentPath }: SidebarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b border-border/60 px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        <div className="px-3 pb-2 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Kelola
        </div>
        {navItems.map((n) => {
          const isActive =
            currentPath === n.href ||
            (n.href !== '/' && currentPath.startsWith(n.href + '/'));
          return (
            <Link
              key={n.label}
              href={n.href}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent'
              }`}
            >
              <n.icon className="h-4 w-4 shrink-0" />
              <span>{n.label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_1px_var(--color-primary)]" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/60 p-3">
        <div className="rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="flex items-center gap-2 font-mono text-[10px] text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            STATUS · OPERATIONAL
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Semua sistem berjalan normal.
          </div>
        </div>
        <Button
          variant="ghost"
          className="mt-2 w-full justify-start text-sidebar-foreground/80 hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </aside>
  );
}
