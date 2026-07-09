import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, plans, routers } from "@/db/schema/tables";
import { getDeviceHandler } from "@/lib/devices/resolver";

// ── Zod schemas ───────────────────────────────────────────────────
const createCustomerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fullName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  routerId: z.string().min(1, "Router is required"),
  planId: z.string().min(1, "Plan is required"),
  status: z.enum(["active", "expired", "disabled"]).default("active"),
  macAddress: z.string().optional(),
  ipAddress: z.string().optional(),
  expiredAt: z.string().datetime().optional(),
});

// ── GET /api/customers — list customers ───────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const allCustomers = await db
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
      .orderBy(customers.createdAt);

    return NextResponse.json({ status: "success", data: allCustomers });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}

// ── POST /api/customers — create customer ─────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = createCustomerSchema.safeParse(body);

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

    const {
      username,
      password,
      fullName,
      email,
      phone,
      routerId,
      planId,
      status,
      macAddress,
      ipAddress,
      expiredAt,
    } = parsed.data;

    const customerId = randomUUID();
    const now = new Date();

    // Fetch the plan for device handler
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

    const customerData = {
      id: customerId,
      username,
      password,
      fullName: fullName ?? null,
      email: email || null,
      phone: phone ?? null,
      routerId,
      planId,
      status,
      macAddress: macAddress ?? null,
      ipAddress: ipAddress ?? null,
      expiredAt: expiredAt ? new Date(expiredAt) : null,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into DB
    await db.insert(customers).values(customerData);

    // Sync to router via device handler
    try {
      const handler = getDeviceHandler(plan.type);
      await handler.addCustomer(customerData, plan);
    } catch (handlerError) {
      return NextResponse.json(
        {
          status: "success",
          data: customerData,
          warning:
            handlerError instanceof Error
              ? handlerError.message
              : "Failed to sync customer to router",
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { status: "success", data: customerData },
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
