import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { orders, storeVouchers, customers, routers } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await getSession(request); // auth check — throws if unauthorized

    // Today's start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count fulfilled store orders today
    const todayOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(eq(orders.status, 'fulfilled'), gte(orders.createdAt, today)));

    const todayRevenue = await db
      .select({ total: sql<number>`coalesce(sum(amount_idr), 0)` })
      .from(orders)
      .where(and(eq(orders.status, 'fulfilled'), gte(orders.createdAt, today)));

    // Customer counts
    const activeCustomers = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.status, 'active'));

    const onlineRouters = await db
      .select({ count: sql<number>`count(*)` })
      .from(routers)
      .where(eq(routers.status, 'online'));

    const totalRouters = await db
      .select({ count: sql<number>`count(*)` })
      .from(routers);

    // Recent orders for transactions table
    const recentOrders = await db.query.orders.findMany({
      limit: 10,
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: {
        package: { columns: { name: true } },
        storeVouchers: { columns: { id: true } },
      },
    });

    // Active vouchers
    const activeStoreVouchers = await db.query.storeVouchers.findMany({
      limit: 10,
      orderBy: (storeVouchers, { desc }) => [desc(storeVouchers.createdAt)],
      with: {
        order: { columns: { createdAt: true } },
      },
    });

    // Sales chart data — 24 placeholder data points
    const salesData = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 60) + 10,
    );

    return NextResponse.json({
      status: 'success',
      data: {
        stats: [
          {
            label: 'Pendapatan Hari Ini',
            value: `Rp ${Number(todayRevenue[0]?.total || 0).toLocaleString('id-ID')}`,
            delta: `${todayOrders[0]?.count || 0} transaksi`,
            tone: 'primary',
          },
          {
            label: 'Voucher Terjual',
            value: String(todayOrders[0]?.count || 0),
            delta: 'hari ini',
            tone: 'primary',
          },
          {
            label: 'User Online',
            value: String(activeCustomers[0]?.count || 0),
            delta: 'live',
            tone: 'accent',
          },
          {
            label: 'Router Aktif',
            value: `${onlineRouters[0]?.count || 0}/${totalRouters[0]?.count || 0}`,
            delta: 'online',
            tone: 'warning',
          },
        ],
        salesData,
        transactions: recentOrders.map((o) => ({
          code: o.id.slice(0, 8).toUpperCase(),
          pkg: o.package?.name || '-',
          price: `Rp ${o.amountIdr.toLocaleString('id-ID')}`,
          pay: 'QRIS',
          user: o.waNumber.slice(0, 12) + 'xx',
          status:
            o.status === 'fulfilled'
              ? 'sukses'
              : o.status === 'paid'
                ? 'pending'
                : o.status,
          time: formatRelativeTime(o.createdAt),
        })),
        activeVouchers: activeStoreVouchers.map((v) => ({
          code: v.username,
          pkg: 'Voucher',
          left: v.createdAt
            ? `${Math.floor((Date.now() - new Date(v.createdAt).getTime()) / 3600000)}h`
            : '-',
        })),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 },
    );
  }
}

function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return '-';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}
