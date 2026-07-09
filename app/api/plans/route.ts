import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plans, routers } from "@/db/schema/tables";
import { getDeviceHandler } from "@/lib/devices/resolver";

// ── Zod schemas ───────────────────────────────────────────────────
const createPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["hotspot", "pppoe"]).default("hotspot"),
  routerId: z.string().min(1, "Router is required"),
  sharedUsers: z.coerce.number().int().default(1),
  rateLimitDown: z.string().optional(),
  rateLimitUp: z.string().optional(),
  burstLimit: z.string().optional(),
  timeLimit: z.coerce.number().int().optional(),
  dataLimit: z.coerce.number().int().optional(),
  validity: z.coerce.number().int("Validity is required"),
  price: z.coerce.number().default(0),
  enabled: z.boolean().default(true),
  poolId: z.string().optional(),
});

// ── GET /api/plans — list all plans ───────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const allPlans = await db
      .select({
        id: plans.id,
        name: plans.name,
        type: plans.type,
        routerId: plans.routerId,
        routerName: routers.name,
        sharedUsers: plans.sharedUsers,
        rateLimitDown: plans.rateLimitDown,
        rateLimitUp: plans.rateLimitUp,
        burstLimit: plans.burstLimit,
        timeLimit: plans.timeLimit,
        dataLimit: plans.dataLimit,
        validity: plans.validity,
        price: plans.price,
        enabled: plans.enabled,
        poolId: plans.poolId,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
      })
      .from(plans)
      .leftJoin(routers, eq(plans.routerId, routers.id))
      .orderBy(plans.createdAt);

    return NextResponse.json({ status: "success", data: allPlans });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}

// ── POST /api/plans — create plan ─────────────────────────────────
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
    const parsed = createPlanSchema.safeParse(body);

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
      name,
      type,
      routerId,
      sharedUsers,
      rateLimitDown,
      rateLimitUp,
      burstLimit,
      timeLimit,
      dataLimit,
      validity,
      price,
      enabled,
      poolId,
    } = parsed.data;

    const planId = randomUUID();
    const now = new Date();

    // Insert into DB
    await db.insert(plans).values({
      id: planId,
      name,
      type,
      routerId,
      sharedUsers,
      rateLimitDown: rateLimitDown ?? null,
      rateLimitUp: rateLimitUp ?? null,
      burstLimit: burstLimit ?? null,
      timeLimit: timeLimit ?? null,
      dataLimit: dataLimit ? BigInt(dataLimit) : null,
      validity,
      price: String(price),
      enabled,
      poolId: poolId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // Fetch the created plan with router info for device handler
    const [created] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    // Create profile on the router via device handler
    try {
      const handler = getDeviceHandler(type);
      await handler.addPlan(created);
    } catch (handlerError) {
      // If router sync fails, we still return the plan but with a warning
      return NextResponse.json(
        {
          status: "success",
          data: created,
          warning:
            handlerError instanceof Error
              ? handlerError.message
              : "Failed to sync plan to router",
        },
        { status: 201 },
      );
    }

    return NextResponse.json({ status: "success", data: created }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}
