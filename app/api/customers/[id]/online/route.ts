import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession, routerOwnerWhere } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { customers, plans, routers } from "@/db/schema/tables";
import { getDeviceHandler } from "@/lib/devices/resolver";

// ── GET /api/customers/[id]/online — check online status ──────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request);

    const { id } = await params;

    const [row] = await db
      .select({
        id: customers.id,
        username: customers.username,
        routerId: customers.routerId,
        planId: customers.planId,
      })
      .from(customers)
      .leftJoin(routers, eq(customers.routerId, routers.id))
      .where(routerOwnerWhere(session, eq(customers.id, id)))
      .limit(1);

    const customer = row;

    if (!customer) {
      return NextResponse.json(
        { status: "error", message: "Customer not found" },
        { status: 404 },
      );
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
    const onlineStatus = await handler.onlineCustomer(
      customer.username,
      customer.routerId,
    );

    return NextResponse.json({
      status: "success",
      data: {
        online: onlineStatus !== null,
        session: onlineStatus,
      },
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
