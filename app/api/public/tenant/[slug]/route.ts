import { NextRequest, NextResponse } from 'next/server';
import { getTenantWithPackages } from '@/lib/storefront/queries';

// ── GET /api/public/tenant/[slug] — get tenant with packages ─────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const result = await getTenantWithPackages(slug);

    if (!result) {
      return NextResponse.json(
        { status: 'error', message: 'Tenant not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: 'success', data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
