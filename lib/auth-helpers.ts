import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { routers } from "@/db/schema/tables";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function getSession(request: Request): Promise<Session> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }
  return session;
}

export function isSuperAdmin(session: Session): boolean {
  return (session.user as { role?: string }).role === "super_admin";
}

export function routerOwnerFilter(session: Session): SQL | undefined {
  if (isSuperAdmin(session)) return undefined;
  return eq(routers.userId, session.user.id);
}

export function routerOwnerWhere(session: Session, baseCondition: SQL): SQL {
  const filter = routerOwnerFilter(session);
  if (!filter) return baseCondition;
  return and(baseCondition, filter)!;
}
