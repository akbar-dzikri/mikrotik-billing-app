// @vitest-environment jsdom
import './setup';

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const pkg = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Paket 1 Hari',
  description: null,
  priceIdr: 10000,
  durationLabel: '1 Hari',
  sortOrder: 1,
};

import { PackageCard } from '@/components/storefront/PackageCard';

describe('PackageCard', () => {
  it('calls onSelect with the package on click', () => {
    const onSelect = vi.fn();
    render(<PackageCard pkg={pkg} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Beli sekarang/i }));

    expect(onSelect).toHaveBeenCalledWith(pkg);
  });
});
