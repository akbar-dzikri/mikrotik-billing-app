import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { mikrotikConfigs, storePackages } from '@/db/schema';
import { createOrder } from '@/lib/storefront/orders';

// ── Zod schema ────────────────────────────────────────────────────
const createOrderByTokenSchema = z.object({
  token: z.string().min(1).max(80),
  packageId: z.string().uuid(),
  customerName: z.string().min(2).max(80),
  waNumber: z.string().regex(/^(\+62|62|0)8\d{7,12}$/, 'Invalid WhatsApp number'),
});

// ── POST /api/voucher/[token]/order — create order by token ───────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const body = await request.json();
    // Allow token from both URL param and body
    const merged = { ...body, token };
    const parsed = createOrderByTokenSchema.safeParse(merged);

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

    const { packageId, customerName, waNumber } = parsed.data;

    // Look up tenant via mikrotik config token
    const cfg = await db.query.mikrotikConfigs.findFirst({
      where: eq(mikrotikConfigs.id, token),
      columns: { id: true, tenantId: true, isActive: true },
    });

    if (!cfg) {
      return NextResponse.json(
        { status: 'error', message: 'Voucher link not found' },
        { status: 404 },
      );
    }

    if (!cfg.isActive) {
      return NextResponse.json(
        { status: 'error', message: 'Voucher online sedang nonaktif' },
        { status: 400 },
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

    if (pkg.tenantId !== cfg.tenantId) {
      return NextResponse.json(
        { status: 'error', message: 'Package does not belong to this tenant' },
        { status: 400 },
      );
    }

    // Create the order
    const result = await createOrder({
      tenantId: cfg.tenantId,
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
