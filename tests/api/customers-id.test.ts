import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockRouterOwnerFilter } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRouterOwnerFilter: vi.fn(),
}));

const { mockDb } = vi.hoisted(() => {
  const dq: any = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    then(r: any) {
      r([]);
    },
    catch() {},
    finally() {},
  };
  return {
    mockDb: {
      select: vi.fn(() => dq),
      insert: vi.fn(() => dq),
      update: vi.fn(() => dq),
      delete: vi.fn(() => dq),
    },
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth-helpers', () => ({
  getSession: mockGetSession,
  routerOwnerFilter: mockRouterOwnerFilter,
}));

const { mockGetDeviceHandler } = vi.hoisted(() => ({ mockGetDeviceHandler: vi.fn() }));
vi.mock('@/lib/devices/resolver', () => ({ getDeviceHandler: mockGetDeviceHandler }));

import { GET, DELETE } from '@/app/api/customers/[id]/route';
import { buildSession, buildCustomer, buildPlan, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

const params = Promise.resolve({ id: 'cust-1' });

describe('GET /api/customers/[id]', () => {
  const session = buildSession();
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session);
    mockRouterOwnerFilter.mockReturnValue(undefined);
  });

  it('returns a customer by id', async () => {
    mockDb.select.mockReturnValue(
      createMockQuery([
        {
          id: 'cust-1',
          username: 'testuser',
          fullName: 'Test User',
          email: null,
          phone: null,
          routerId: 'router-1',
          routerName: 'Router 1',
          planId: 'plan-1',
          planName: 'Plan 1',
          planType: 'hotspot',
          status: 'active',
          macAddress: null,
          ipAddress: null,
          expiredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    );
    const res = await GET(buildRequest('GET', '/api/customers/cust-1'), { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.id).toBe('cust-1');
  });

  it('returns 404 when customer not found', async () => {
    mockDb.select.mockReturnValue(createMockQuery([]));
    const res = await GET(buildRequest('GET', '/api/customers/cust-1'), { params });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/customers/[id]', () => {
  const session = buildSession();
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session);
    mockRouterOwnerFilter.mockReturnValue(undefined);
  });

  it('deletes a customer', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildCustomer({ id: 'cust-1' })]));
    mockDb.select.mockReturnValueOnce(createMockQuery([buildPlan({ id: 'plan-1' })]));
    const handler = { removeCustomer: vi.fn().mockResolvedValue(undefined) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await DELETE(buildRequest('DELETE', '/api/customers/cust-1'), { params });
    expect(res.status).toBe(200);
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when customer not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([]));
    const res = await DELETE(buildRequest('DELETE', '/api/customers/cust-1'), { params });
    expect(res.status).toBe(404);
  });
});
