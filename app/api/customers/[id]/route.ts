import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { getSession, routerOwnerFilter } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { customers, plans, routers } from '@/db/schema/tables';
import { getDeviceHandler } from '@/lib/devices/resolver';

// ── GET /api/customers/[id] — single customer ─────────────────────
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request);

    const { id } = await params;
    const ownerFilter = routerOwnerFilter(session);

    const [customer] = await db
      .select({
        id: customers.id,
        username: customers.username,
        fullName: customers.fullName,
        email: customers.email,
        phone: customers.phone,
        routerId: customers.routerId,
        routerName: routers.name,
        planId: customers.planId,
        planName: plans.name,
        planType: plans.type,
        status: customers.status,
        macAddress: customers.macAddress,
        ipAddress: customers.ipAddress,
        expiredAt: customers.expiredAt,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .leftJoin(routers, eq(customers.routerId, routers.id))
      .leftJoin(plans, eq(customers.planId, plans.id))
      .where(ownerFilter ? and(eq(customers.id, id), ownerFilter) : eq(customers.id, id))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ status: 'error', message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', data: customer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}

// ── DELETE /api/customers/[id] — remove customer ──────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request);

    const { id } = await params;
    const ownerFilter = routerOwnerFilter(session);

    // Fetch customer with plan before deleting
    const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);

    if (!customer) {
      return NextResponse.json({ status: 'error', message: 'Customer not found' }, { status: 404 });
    }

    if (ownerFilter) {
      const [owned] = await db
        .select({ id: routers.id })
        .from(routers)
        .where(and(eq(routers.id, customer.routerId), ownerFilter))
        .limit(1);
      if (!owned) {
        return NextResponse.json(
          { status: 'error', message: 'Customer not found' },
          { status: 404 },
        );
      }
    }

    // Fetch associated plan for device handler
    const [plan] = await db.select().from(plans).where(eq(plans.id, customer.planId!)).limit(1);

    // Remove from router via device handler first
    try {
      if (plan) {
        const handler = getDeviceHandler(plan.type);
        await handler.removeCustomer(customer, plan);
      }
    } catch {
      // Proceed with deletion even if router sync fails
    }

    // Delete with ownership check via subquery (Drizzle doesn't support joins in DELETE)
    if (ownerFilter) {
      const ownedRouterSubquery = db
        .select({ routerId: routers.id })
        .from(routers)
        .where(ownerFilter);
      await db
        .delete(customers)
        .where(and(eq(customers.id, id), inArray(customers.routerId, ownedRouterSubquery)));
    } else {
      await db.delete(customers).where(eq(customers.id, id));
    }

    return NextResponse.json({ status: 'success', data: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
