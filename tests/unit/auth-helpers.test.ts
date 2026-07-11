import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock('@/lib/db', () => ({
  db: {},
}));

// Mock routers as a drizzle-like table so eq(routers.userId, ...) works
const mockRouters = { userId: 'routers.user_id' };
vi.mock('@/db/schema/tables', () => ({
  routers: { userId: 'routers.user_id' },
}));

import { getSession, isSuperAdmin, routerOwnerFilter } from '@/lib/auth-helpers';

function makeRequest() {
  return new Request('http://localhost:3000/api/test');
}

describe('getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns session when authenticated', async () => {
    const session = {
      user: { id: 'user-1', email: 'admin@example.com', role: 'admin' },
      session: { id: 'sess-1' },
    };
    mockGetSession.mockResolvedValue(session);

    const result = await getSession(makeRequest());
    expect(result).toEqual(session);
  });

  it('throws when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(getSession(makeRequest())).rejects.toThrow();
  });
});

describe('isSuperAdmin', () => {
  it('returns true for super_admin role', () => {
    const session = {
      user: { id: 'user-1', role: 'super_admin' },
      session: { id: 'sess-1' },
    } as any;
    expect(isSuperAdmin(session)).toBe(true);
  });

  it('returns false for admin role', () => {
    const session = {
      user: { id: 'user-1', role: 'admin' },
      session: { id: 'sess-1' },
    } as any;
    expect(isSuperAdmin(session)).toBe(false);
  });
});

describe('routerOwnerFilter', () => {
  it('returns undefined for super_admin', () => {
    const session = {
      user: { id: 'user-1', role: 'super_admin' },
      session: { id: 'sess-1' },
    } as any;
    expect(routerOwnerFilter(session)).toBeUndefined();
  });

  it('returns a SQL filter for admin', () => {
    const session = {
      user: { id: 'user-1', role: 'admin' },
      session: { id: 'sess-1' },
    } as any;
    const filter = routerOwnerFilter(session);
    // eq() returns a SQL object — should be truthy
    expect(filter).toBeTruthy();
  });
});
