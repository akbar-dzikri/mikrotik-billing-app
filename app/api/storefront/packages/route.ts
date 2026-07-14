import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { tenants, storePackages } from '@/db/schema';

// ── Zod schema ────────────────────────────────────────────────────
const createPackageSchema = z.object({
  tenantId: z.string().min(1, 'tenantId is required'),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  planId: z.string().optional(),
  priceIdr: z.coerce.number().int().positive(),
  durationLabel: z.string().min(1).max(100),
  sortOrder: z.coerce.number().int().optional(),
});

// ── POST /api/storefront/packages — create store package ──────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    const body = await request.json();
    const parsed = createPackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { tenantId, name, description, planId, priceIdr, durationLabel, sortOrder } =
      parsed.data;

    // Verify the tenant exists
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { status: 'error', message: 'Tenant not found' },
        { status: 404 },
      );
    }

    const id = randomUUID();

    await db.insert(storePackages).values({
      id,
      tenantId,
      name,
      description: description ?? null,
      planId: planId ?? null,
      priceIdr,
      durationLabel,
      sortOrder: sortOrder ?? 0,
      isActive: true,
      createdAt: new Date(),
    });

    const [created] = await db
      .select()
      .from(storePackages)
      .where(eq(storePackages.id, id))
      .limit(1);

    return NextResponse.json({ status: 'success', data: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
