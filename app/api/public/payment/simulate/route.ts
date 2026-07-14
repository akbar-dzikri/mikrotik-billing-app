import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { simulatePayment } from '@/lib/storefront/orders';

// ── Zod schema ────────────────────────────────────────────────────
const simulatePaymentSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
});

// ── POST /api/public/payment/simulate — simulate payment ──────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = simulatePaymentSchema.safeParse(body);

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

    const { orderId } = parsed.data;

    const result = await simulatePayment(orderId);

    return NextResponse.json({ status: 'success', data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
