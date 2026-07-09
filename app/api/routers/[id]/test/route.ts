import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { routers } from "@/db/schema/tables";
import { getRouterClient } from "@/lib/mikrotik-client";

// ── POST /api/routers/[id]/test — test connection ─────────────────
export async function POST(
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

    // Fetch the full router record with encrypted fields
    const [router] = await db
      .select()
      .from(routers)
      .where(eq(routers.id, id))
      .limit(1);

    if (!router) {
      return NextResponse.json(
        { status: "error", message: "Router not found" },
        { status: 404 },
      );
    }

    const startTime = Date.now();
    let client;

    try {
      client = await getRouterClient({
        id: router.id,
        host: router.host,
        apiPort: router.apiPort,
        username: router.username,
        encryptedPassword: router.encryptedPassword,
        encryptionIv: router.encryptionIv,
        encryptionTag: router.encryptionTag,
        tlsFingerprint: router.tlsFingerprint,
        tlsVerified: router.tlsVerified,
      });

      // Run a simple health check command
      await client.write("/system/resource/print");

      const latency = Math.round(Date.now() - startTime);

      // Update router status to online
      await db
        .update(routers)
        .set({
          status: "online",
          lastSeen: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(routers.id, id));

      return NextResponse.json({
        status: "success",
        data: {
          status: "online",
          latency,
        },
      });
    } catch (err) {
      await db
        .update(routers)
        .set({
          status: "offline",
          updatedAt: new Date(),
        })
        .where(eq(routers.id, id));

      return NextResponse.json(
        {
          status: "error",
          message: err instanceof Error ? err.message : "Connection failed",
        },
        { status: 503 },
      );
    } finally {
      if (client) {
        try {
          client.close();
        } catch {
          // Ignore close errors
        }
      }
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}
