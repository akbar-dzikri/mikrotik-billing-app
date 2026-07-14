import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { tenants } from '@/db/schema';

// ── Zod schemas ───────────────────────────────────────────────────
const updateTenantSchema = z.object({
  slug: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(200).optional(),
  tagline: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
  waSupport: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// ── GET /api/storefront/tenants/[id] — get single tenant ──────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getSession(request);

    const { id } = await params;

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
      with: {
        storePackages: {
          orderBy: (sp, { asc }) => [asc(sp.sortOrder)],
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { status: 'error', message: 'Tenant not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: 'success', data: tenant });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}

// ── PUT /api/storefront/tenants/[id] — update tenant ──────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getSession(request);

    const { id } = await params;

    const [existing] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { status: 'error', message: 'Tenant not found' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateTenantSchema.safeParse(body);

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

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    await db.update(tenants).set(updateData).where(eq(tenants.id, id));

    const [updated] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    return NextResponse.json({ status: 'success', data: updated });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}

// ── DELETE /api/storefront/tenants/[id] — delete tenant ───────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await getSession(request);

    const { id } = await params;

    const [existing] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { status: 'error', message: 'Tenant not found' },
        { status: 404 },
      );
    }

    await db.delete(tenants).where(eq(tenants.id, id));

    return NextResponse.json({ status: 'success', data: null });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
