import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, plans } from "@/db/schema/tables";
import { getDeviceHandler } from "@/lib/devices/resolver";

// ── GET /api/customers/[id]/online — check online status ──────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

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
