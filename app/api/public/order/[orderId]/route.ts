import { NextRequest, NextResponse } from 'next/server';
import { getOrderDetails } from '@/lib/storefront/queries';

// ── GET /api/public/order/[orderId] — get order details ───────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;

    const order = await getOrderDetails(orderId);

    if (!order) {
      return NextResponse.json(
        { status: 'error', message: 'Order not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: 'success', data: order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
