import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tenants, storePackages } from '@/db/schema';
import { createOrder } from '@/lib/storefront/orders';

// ── Zod schema ────────────────────────────────────────────────────
const createOrderSchema = z.object({
  slug: z.string().min(1).max(80),
  packageId: z.string().uuid(),
  customerName: z.string().min(2).max(80),
  waNumber: z.string().regex(/^(\+62|62|0)8\d{7,12}$/, 'Invalid WhatsApp number'),
});

// ── POST /api/public/order — create order ─────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

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

    const { slug, packageId, customerName, waNumber } = parsed.data;

    // Look up tenant by slug
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
      columns: { id: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { status: 'error', message: 'Tenant not found' },
        { status: 404 },
      );
    }

    // Look up package and verify it belongs to the tenant
    const pkg = await db.query.storePackages.findFirst({
      where: eq(storePackages.id, packageId),
      columns: { id: true, tenantId: true, priceIdr: true },
    });

    if (!pkg) {
      return NextResponse.json(
        { status: 'error', message: 'Package not found' },
        { status: 404 },
      );
    }

    if (pkg.tenantId !== tenant.id) {
      return NextResponse.json(
        { status: 'error', message: 'Package does not belong to this tenant' },
        { status: 400 },
      );
    }

    // Create the order
    const result = await createOrder({
      tenantId: tenant.id,
      packageId: pkg.id,
      customerName,
      waNumber,
      amountIdr: pkg.priceIdr,
    });

    return NextResponse.json(
      { status: 'success', data: { orderId: result.orderId } },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
