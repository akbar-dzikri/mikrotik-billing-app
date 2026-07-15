// @vitest-environment jsdom
import './setup';

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { StatsGrid } from '@/components/dashboard/StatsGrid';
import type { LucideIcon } from 'lucide-react';
import { Wallet } from 'lucide-react';

const stats = [
  { label: 'Pendapatan Hari Ini', value: 'Rp 0', delta: '0', tone: 'primary', icon: Wallet as LucideIcon },
  { label: 'Voucher Terjual', value: '0', delta: '0', tone: 'primary', icon: Wallet as LucideIcon },
];

describe('StatsGrid', () => {
  it('renders stat labels from provided stats', () => {
    render(<StatsGrid stats={stats} />);

    expect(screen.getByText('Pendapatan Hari Ini')).toBeInTheDocument();
  });
});
