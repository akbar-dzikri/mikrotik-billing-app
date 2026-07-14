'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          userName={session.user?.name || 'Admin'}
          userEmail={session.user?.email || ''}
        />
        <main className="flex-1 space-y-6 p-6">{children}</main>
      </div>
    </div>
  );
}
