// @vitest-environment jsdom
import './setup';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
const mockSignInEmail = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock('@/lib/auth-client', () => ({
  signIn: { email: (...args: unknown[]) => mockSignInEmail(...args) },
  signOut: vi.fn(),
  useSession: () => ({ data: null, isPending: false }),
}));

import LoginPage from '@/app/(auth)/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInEmail.mockResolvedValue({ error: null });
  });

  it('renders the Sign In heading', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('calls signIn.email and navigates on success', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'secret',
      });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message when signIn fails', async () => {
    mockSignInEmail.mockResolvedValue({ error: { message: 'Invalid credentials' } });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
