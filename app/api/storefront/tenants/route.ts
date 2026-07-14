import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { sql, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { tenants, storePackages } from '@/db/schema';

// ── Zod schemas ───────────────────────────────────────────────────
const createTenantSchema = z.object({
  slug: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  tagline: z.string().optional(),
  brandColor: z.string().optional(),
  waSupport: z.string().optional(),
});

// ── GET /api/storefront/tenants — list all tenants ────────────────
export async function GET(request: NextRequest) {
  try {
    await getSession(request);

    const allTenants = await db
      .select({
        id: tenants.id,
        slug: tenants.slug,
        name: tenants.name,
        tagline: tenants.tagline,
        brandColor: tenants.brandColor,
        waSupport: tenants.waSupport,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt,
        storePackagesCount: sql<number>`count(${storePackages.id})`.as('store_packages_count'),
      })
      .from(tenants)
      .leftJoin(storePackages, eq(storePackages.tenantId, tenants.id))
      .groupBy(tenants.id)
      .orderBy(tenants.createdAt);

    return NextResponse.json({ status: 'success', data: allTenants });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}

// ── POST /api/storefront/tenants — create tenant ──────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    const body = await request.json();
    const parsed = createTenantSchema.safeParse(body);

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

    const { slug, name, tagline, brandColor, waSupport } = parsed.data;

    const id = randomUUID();
    const now = new Date();

    await db.insert(tenants).values({
      id,
      userId: session.user.id,
      slug,
      name,
      tagline: tagline ?? null,
      brandColor: brandColor ?? null,
      waSupport: waSupport ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const [created] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    return NextResponse.json({ status: 'success', data: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
