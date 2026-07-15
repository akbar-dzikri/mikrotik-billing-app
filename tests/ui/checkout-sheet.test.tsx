// @vitest-environment jsdom
import './setup';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const tenant = {
  id: 't1',
  slug: 'e2e-tenant',
  name: 'E2E',
  tagline: null,
  brandColor: null,
  waSupport: null,
};

const pkg = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Paket 1 Hari',
  description: null,
  priceIdr: 10000,
  durationLabel: '1 Hari',
  sortOrder: 1,
};

const mockPush = vi.fn();
const mockFetch = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

import { CheckoutSheet } from '@/components/storefront/CheckoutSheet';

describe('CheckoutSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ status: 'success', data: { orderId: 'oid' } }),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);
  });

  it('shows name validation error and does not call fetch', async () => {
    render(
      <CheckoutSheet
        tenant={tenant}
        pkg={pkg}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nama'), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /Lanjut ke pembayaran/i }));

    expect(await screen.findByText('Nama minimal 2 karakter')).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows phone validation error', async () => {
    render(
      <CheckoutSheet
        tenant={tenant}
        pkg={pkg}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nama'), { target: { value: 'Budi' } });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/i), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Lanjut ke pembayaran/i }));

    expect(
      await screen.findByText('Nomor WA Indonesia tidak valid'),
    ).toBeInTheDocument();
  });

  it('submits valid order to /api/public/order', async () => {
    render(
      <CheckoutSheet
        tenant={tenant}
        pkg={pkg}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nama'), { target: { value: 'Budi' } });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/i), {
      target: { value: '08123456789' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Lanjut ke pembayaran/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/public/order');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      slug: 'e2e-tenant',
      packageId: pkg.id,
      customerName: 'Budi',
      waNumber: '08123456789',
    });
    expect(JSON.stringify(body)).toContain('e2e-tenant');
    expect(JSON.stringify(body)).toContain('08123456789');
  });
});
