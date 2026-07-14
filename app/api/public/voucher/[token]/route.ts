import { NextRequest, NextResponse } from 'next/server';
import { getTenantByToken } from '@/lib/storefront/queries';

// ── GET /api/public/voucher/[token] — get tenant + packages by token ───
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const result = await getTenantByToken(token);

    if (!result) {
      return NextResponse.json(
        { status: 'error', message: 'Voucher link not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: 'success', data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
