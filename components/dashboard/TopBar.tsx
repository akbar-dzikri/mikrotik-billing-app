'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  userName: string;
  userEmail: string;
}

export function TopBar({ userName, userEmail }: TopBarProps) {
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';
  const workspaceName = userEmail ? userEmail.split('@')[0] : 'workspace';

  return (
    <div className="flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-6 backdrop-blur">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Cari..."
          className="h-9 w-full rounded-md border border-border bg-card/50 pl-9 pr-16 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-mono text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="hidden text-xs sm:block">
            <div className="font-medium text-foreground">
              {userName || 'Admin'}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {userEmail}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
