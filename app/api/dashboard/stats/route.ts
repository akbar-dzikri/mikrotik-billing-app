import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { orders, storeVouchers, customers, routers } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's fulfilled orders count
    const [todayOrders] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.status, 'fulfilled'), gte(orders.createdAt, today)));

    // Today's revenue
    const [todayRevenue] = await db
      .select({ total: sql<number>`coalesce(sum(amount_idr), 0)` })
      .from(orders)
      .where(and(eq(orders.status, 'fulfilled'), gte(orders.createdAt, today)));

    // Active customers
    const [activeCust] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(eq(customers.status, 'active'));

    // Online routers
    const [onlineRtr] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(routers)
      .where(eq(routers.status, 'online'));

    // Total routers
    const [totalRtr] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(routers);

    // Recent orders for transactions table
    const recentOrders = await db.query.orders.findMany({
      limit: 10,
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: { package: { columns: { name: true } } },
    });

    const formatTime = (date: Date) => {
      const diff = Date.now() - new Date(date).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins} mnt lalu`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} jam lalu`;
      return `${Math.floor(hours / 24)} hari lalu`;
    };

    return NextResponse.json({
      status: 'success',
      data: {
        stats: [
          { label: 'Pendapatan Hari Ini', value: 'Rp ' + Number(todayRevenue?.total || 0).toLocaleString('id-ID'), delta: todayOrders?.count + ' transaksi', tone: 'primary' },
          { label: 'Voucher Terjual', value: String(todayOrders?.count || 0), delta: 'hari ini', tone: 'primary' },
          { label: 'User Online', value: String(activeCust?.count || 0), delta: 'live', tone: 'accent' },
          { label: 'Router Aktif', value: onlineRtr?.count + '/' + totalRtr?.count, delta: 'online', tone: 'warning' },
        ],
        transactions: recentOrders.map(o => ({
          code: o.id.slice(0, 8).toUpperCase(),
          pkg: o.package?.name || '-',
          price: 'Rp ' + o.amountIdr.toLocaleString('id-ID'),
          pay: 'QRIS',
          user: o.waNumber.slice(0, 12) + 'xx',
          status: o.status === 'fulfilled' ? 'sukses' : o.status === 'paid' ? 'pending' : o.status,
          time: formatTime(o.createdAt || new Date()),
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
