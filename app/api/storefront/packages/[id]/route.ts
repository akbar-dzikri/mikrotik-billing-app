import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { storePackages } from '@/db/schema';

// ── Zod schema ────────────────────────────────────────────────────
const updatePackageSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  planId: z.string().nullable().optional(),
  priceIdr: z.coerce.number().int().positive().optional(),
  durationLabel: z.string().min(1).max(100).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

// ── PUT /api/storefront/packages/[id] — update package ────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getSession(request);

    const { id } = await params;

    const [existing] = await db
      .select({ id: storePackages.id })
      .from(storePackages)
      .where(eq(storePackages.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { status: 'error', message: 'Package not found' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updatePackageSchema.safeParse(body);

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

    await db
      .update(storePackages)
      .set(parsed.data)
      .where(eq(storePackages.id, id));

    const [updated] = await db
      .select()
      .from(storePackages)
      .where(eq(storePackages.id, id))
      .limit(1);

    return NextResponse.json({ status: 'success', data: updated });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}

// ── DELETE /api/storefront/packages/[id] — delete package ─────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getSession(request);

    const { id } = await params;

    const [existing] = await db
      .select({ id: storePackages.id })
      .from(storePackages)
      .where(eq(storePackages.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { status: 'error', message: 'Package not found' },
        { status: 404 },
      );
    }

    await db.delete(storePackages).where(eq(storePackages.id, id));

    return NextResponse.json({ status: 'success', data: null });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
