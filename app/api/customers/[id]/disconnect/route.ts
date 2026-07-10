import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSession, routerOwnerFilter } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { customers, plans, routers } from "@/db/schema/tables";
import { getDeviceHandler } from "@/lib/devices/resolver";

// ── POST /api/customers/[id]/disconnect — force disconnect ────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request);

    const { id } = await params;
    const ownerFilter = routerOwnerFilter(session);

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { status: "error", message: "Customer not found" },
        { status: 404 },
      );
    }

    if (ownerFilter) {
      const [owned] = await db
        .select({ id: routers.id })
        .from(routers)
        .where(and(eq(routers.id, customer.routerId), ownerFilter))
        .limit(1);
      if (!owned) {
        return NextResponse.json(
          { status: "error", message: "Customer not found" },
          { status: 404 },
        );
      }
    }

    // Fetch plan for device handler
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, customer.planId!))
      .limit(1);

    if (!plan) {
      return NextResponse.json(
        { status: "error", message: "Plan not found for customer" },
        { status: 404 },
      );
    }

    const handler = getDeviceHandler(plan.type);
    await handler.disconnectCustomer(customer.username, customer.routerId);

    return NextResponse.json({
      status: "success",
      data: { disconnected: true },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}
