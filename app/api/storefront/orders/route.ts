import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { orders, tenants, storePackages } from '@/db/schema';

// ── GET /api/storefront/orders — list orders with pagination ──────
export async function GET(request: NextRequest) {
  try {
    await getSession(request);

    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 1), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0);

    const allOrders = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        waNumber: orders.waNumber,
        amountIdr: orders.amountIdr,
        status: orders.status,
        paymentRef: orders.paymentRef,
        paidAt: orders.paidAt,
        fulfilledAt: orders.fulfilledAt,
        createdAt: orders.createdAt,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        packageName: storePackages.name,
      })
      .from(orders)
      .leftJoin(tenants, eq(orders.tenantId, tenants.id))
      .leftJoin(storePackages, eq(orders.packageId, storePackages.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ status: 'success', data: allOrders });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
