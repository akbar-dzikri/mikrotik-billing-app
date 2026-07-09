"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Routers", href: "/routers" },
  { label: "Plans", href: "/plans" },
  { label: "Customers", href: "/customers" },
  { label: "Vouchers", href: "/vouchers" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
        <div className="p-6 border-b border-[var(--border)]">
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
                      ? "bg-[var(--surface-2)] text-[var(--accent)] font-medium"
                      : "text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="avatar placeholder">
              <div className="w-8 rounded-full bg-[var(--accent)] text-xs text-white flex items-center justify-center">
                {session.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
            <div className="text-sm">
              <p className="font-medium text-[var(--fg)]">{session.user?.name || "User"}</p>
              <p className="text-[var(--muted)] text-xs">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="btn btn-ghost btn-sm w-full text-[var(--muted)] hover:text-[var(--fg)]"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
