import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plans, routers } from "@/db/schema/tables";
import { getDeviceHandler } from "@/lib/devices/resolver";

// ── Zod schemas ───────────────────────────────────────────────────
const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["hotspot", "pppoe"]).optional(),
  routerId: z.string().min(1).optional(),
  sharedUsers: z.coerce.number().int().optional(),
  rateLimitDown: z.string().nullable().optional(),
  rateLimitUp: z.string().nullable().optional(),
  burstLimit: z.string().nullable().optional(),
  timeLimit: z.coerce.number().int().nullable().optional(),
  dataLimit: z.coerce.number().int().nullable().optional(),
  validity: z.coerce.number().int().optional(),
  price: z.coerce.number().optional(),
  enabled: z.boolean().optional(),
  poolId: z.string().nullable().optional(),
});

// ── GET /api/plans/[id] — single plan ─────────────────────────────
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

    const [plan] = await db
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
      .where(eq(plans.id, id))
      .limit(1);

    if (!plan) {
      return NextResponse.json(
        { status: "error", message: "Plan not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: "success", data: plan });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}

// ── PUT /api/plans/[id] — update plan ─────────────────────────────
export async function PUT(
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

    // Fetch existing plan
    const [existing] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { status: "error", message: "Plan not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updatePlanSchema.safeParse(body);

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

    const { dataLimit, price, ...fields } = parsed.data;

    const updateData: Record<string, unknown> = {
      ...fields,
      updatedAt: new Date(),
    };

    if (dataLimit !== undefined) {
      updateData.dataLimit = dataLimit !== null ? BigInt(dataLimit) : null;
    }

    if (price !== undefined) {
      updateData.price = String(price);
    }

    await db.update(plans).set(updateData).where(eq(plans.id, id));

    // Fetch updated plan for device handler and response
    const [updated] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);

    // Update router profile via device handler
    try {
      const handler = getDeviceHandler(updated.type);
      await handler.updatePlan(existing, updated);
    } catch (handlerError) {
      return NextResponse.json(
        {
          status: "success",
          data: updated,
          warning:
            handlerError instanceof Error
              ? handlerError.message
              : "Failed to sync plan update to router",
        },
      );
    }

    return NextResponse.json({ status: "success", data: updated });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}

// ── DELETE /api/plans/[id] — remove plan ──────────────────────────
export async function DELETE(
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

    // Fetch the plan before deleting (for device handler)
    const [existing] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { status: "error", message: "Plan not found" },
        { status: 404 },
      );
    }

    // Remove profile from router first
    try {
      const handler = getDeviceHandler(existing.type);
      await handler.removePlan(existing);
    } catch (handlerError) {
      // Proceed with deletion even if router sync fails
    }

    await db.delete(plans).where(eq(plans.id, id));

    return NextResponse.json({ status: "success", data: null });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}
