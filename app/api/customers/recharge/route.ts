import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getSession, routerOwnerFilter } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { customers, plans, routers, userRecharges } from "@/db/schema/tables";
import { getDeviceHandler } from "@/lib/devices/resolver";

// ── Zod schemas ───────────────────────────────────────────────────
const rechargeSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  planId: z.string().min(1, "Plan ID is required"),
});

// ── POST /api/customers/recharge — recharge customer ──────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    const body = await request.json();
    const parsed = rechargeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { customerId, planId } = parsed.data;

    // Fetch customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { status: "error", message: "Customer not found" },
        { status: 404 },
      );
    }

    const ownerFilter = routerOwnerFilter(session);
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

    // Fetch the new plan
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!plan) {
      return NextResponse.json(
        { status: "error", message: "Plan not found" },
        { status: 404 },
      );
    }

    const now = new Date();

    // Calculate new expiry
    // If customer is already active and has an expiry in the future, extend from there
    const baseDate =
      customer.status === "active" &&
      customer.expiredAt &&
      customer.expiredAt > now
        ? customer.expiredAt
        : now;

    const newExpiredAt = new Date(
      baseDate.getTime() + plan.validity * 24 * 60 * 60 * 1000,
    );

    const rechargeId = randomUUID();

    // Create userRecharge record
    await db.insert(userRecharges).values({
      id: rechargeId,
      customerId,
      planId,
      routerId: customer.routerId,
      startedAt: now,
      expiredAt: newExpiredAt,
      createdBy: session.user.id,
      updatedBy: session.user.id,
      createdAt: now,
    });

    // Update customer's plan, status, and expiry (with ownership check)
    if (ownerFilter) {
      const ownedRouterSubquery = db
        .select({ routerId: routers.id })
        .from(routers)
        .where(ownerFilter);
      await db
        .update(customers)
        .set({
          planId,
          status: "active",
          expiredAt: newExpiredAt,
          updatedAt: now,
        })
        .where(
          and(
            eq(customers.id, customerId),
            inArray(customers.routerId, ownedRouterSubquery),
          ),
        );
    } else {
      await db
        .update(customers)
        .set({
          planId,
          status: "active",
          expiredAt: newExpiredAt,
          updatedAt: now,
        })
        .where(eq(customers.id, customerId));
    }

    // Sync to router via device handler
    const updatedCustomer = {
      ...customer,
      planId,
      status: "active" as const,
      expiredAt: newExpiredAt,
      updatedAt: now,
    };

    try {
      const handler = getDeviceHandler(plan.type);
      await handler.syncCustomer(updatedCustomer, plan);
    } catch (handlerError) {
      return NextResponse.json(
        {
          status: "success",
          data: {
            rechargeId,
            customerId,
            planId,
            expiredAt: newExpiredAt,
          },
          warning:
            handlerError instanceof Error
              ? handlerError.message
              : "Failed to sync recharge to router",
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        status: "success",
        data: {
          rechargeId,
          customerId,
          planId,
          expiredAt: newExpiredAt,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}
