import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession, routerOwnerWhere } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { routers } from "@/db/schema/tables";
import { encryptPassword } from "@/lib/crypto";

// Fields to exclude from all responses
const safeColumns = {
  id: routers.id,
  name: routers.name,
  host: routers.host,
  apiPort: routers.apiPort,
  username: routers.username,
  tlsFingerprint: routers.tlsFingerprint,
  tlsVerified: routers.tlsVerified,
  status: routers.status,
  lastSeen: routers.lastSeen,
  description: routers.description,
  enabled: routers.enabled,
  createdAt: routers.createdAt,
  updatedAt: routers.updatedAt,
};

const updateRouterSchema = z.object({
  name: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  apiPort: z.coerce.number().int().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});

// ── GET /api/routers/[id] — single router ─────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request);

    const { id } = await params;

    const [router] = await db
      .select(safeColumns)
      .from(routers)
      .where(routerOwnerWhere(session, eq(routers.id, id)))
      .limit(1);

    if (!router) {
      return NextResponse.json(
        { status: "error", message: "Router not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: "success", data: router });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}

// ── PUT /api/routers/[id] — update router ─────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request);

    const { id } = await params;

    // Fetch existing router (including encrypted fields for potential re-encryption)
    const [existing] = await db
      .select()
      .from(routers)
      .where(routerOwnerWhere(session, eq(routers.id, id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { status: "error", message: "Router not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateRouterSchema.safeParse(body);

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

    const { password, ...fields } = parsed.data;

    const updateData: Record<string, unknown> = { ...fields, updatedAt: new Date() };

    // If password is being changed, re-encrypt and clear fingerprint
    if (password) {
      const { ciphertext, iv, authTag } = encryptPassword(password);
      updateData.encryptedPassword = ciphertext;
      updateData.encryptionIv = iv;
      updateData.encryptionTag = authTag;
      // Clear fingerprint — will be re-established on next test-connection
      updateData.tlsFingerprint = null;
      updateData.tlsVerified = false;
      updateData.status = "unknown";
    }

    await db
      .update(routers)
      .set(updateData)
      .where(routerOwnerWhere(session, eq(routers.id, id)));

    // Return safe version
    const [updated] = await db
      .select(safeColumns)
      .from(routers)
      .where(routerOwnerWhere(session, eq(routers.id, id)))
      .limit(1);

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

// ── DELETE /api/routers/[id] — remove router ──────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request);

    const { id } = await params;

    const [existing] = await db
      .select({ id: routers.id })
      .from(routers)
      .where(routerOwnerWhere(session, eq(routers.id, id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { status: "error", message: "Router not found" },
        { status: 404 },
      );
    }

    await db.delete(routers).where(routerOwnerWhere(session, eq(routers.id, id)));

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
