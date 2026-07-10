import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import tls from "tls";
import { getSession, routerOwnerFilter } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { routers } from "@/db/schema/tables";
import { encryptPassword } from "@/lib/crypto";
import { getRouterClient } from "@/lib/mikrotik-client";
import { getCertFingerprint } from "@/lib/tls-fingerprint";

// ── Zod schemas ───────────────────────────────────────────────────
const createRouterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  host: z.string().min(1, "Host is required"),
  apiPort: z.coerce.number().int().default(8729),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  description: z.string().optional(),
});

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

// ── GET /api/routers — list all routers ───────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    const ownerFilter = routerOwnerFilter(session);

    const allRouters = await db
      .select(safeColumns)
      .from(routers)
      .where(ownerFilter ?? undefined)
      .orderBy(routers.createdAt);

    return NextResponse.json({ status: "success", data: allRouters });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 },
    );
  }
}

// ── POST /api/routers — add a new router ──────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    const body = await request.json();
    const parsed = createRouterSchema.safeParse(body);

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

    const { name, host, apiPort, username, password, description } =
      parsed.data;

    // Encrypt the password
    const { ciphertext, iv, authTag } = encryptPassword(password);

    // Generate a router id upfront so we can test the connection
    const routerId = randomUUID();

    // Build a temporary RouterRecord to test the connection
    const temporaryRecord = {
      id: routerId,
      host,
      apiPort,
      username,
      encryptedPassword: ciphertext,
      encryptionIv: iv,
      encryptionTag: authTag,
      tlsFingerprint: null,
      tlsVerified: false,
    };

    let tlsFingerprint: string | null = null;

    try {
      const client = await getRouterClient(temporaryRecord);

      // Extract TLS fingerprint from the connected socket
      const connector = (client as unknown as { connector?: { socket?: tls.TLSSocket } }).connector;
      const socket = connector?.socket;
      if (socket) {
        try {
          tlsFingerprint = getCertFingerprint(socket);
        } catch {
          // Some routers may not present a cert on the first connection
        }
      }

      client.close();
    } catch {
      // Connection failed — we still create the router but mark status offline
    }

    const now = new Date();

    await db.insert(routers).values({
      id: routerId,
      userId: session.user.id,
      name,
      host,
      apiPort,
      username,
      encryptedPassword: ciphertext,
      encryptionIv: iv,
      encryptionTag: authTag,
      tlsFingerprint,
      tlsVerified: false,
      status: tlsFingerprint ? "online" : "unknown",
      lastSeen: tlsFingerprint ? now : null,
      description: description ?? null,
      enabled: true,
      createdBy: session.user.id,
      updatedBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    });

    // Fetch back the safe version
    const [created] = await db
      .select(safeColumns)
      .from(routers)
      .where(eq(routers.id, routerId))
      .limit(1);

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
