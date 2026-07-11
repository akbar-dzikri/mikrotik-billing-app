import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockRouterOwnerFilter } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRouterOwnerFilter: vi.fn(),
}));

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

vi.mock('@/lib/auth-helpers', () => ({
  getSession: mockGetSession,
  routerOwnerFilter: mockRouterOwnerFilter,
}));

const { mockGetDeviceHandler } = vi.hoisted(() => ({
  mockGetDeviceHandler: vi.fn(),
}));

vi.mock('@/lib/devices/resolver', () => ({
  getDeviceHandler: mockGetDeviceHandler,
}));

import { POST } from '@/app/api/customers/[id]/disconnect/route';
import { buildSession, buildCustomer, buildPlan, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

const params = Promise.resolve({ id: 'cust-1' });

describe('POST /api/customers/[id]/disconnect', () => {
  const session = buildSession();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session);
    mockRouterOwnerFilter.mockReturnValue(undefined);
  });

  it('disconnects a customer', async () => {
    const customer = buildCustomer({ id: 'cust-1' });
    const plan = buildPlan({ id: 'plan-1' });

    mockDb.select
      .mockReturnValueOnce(createMockQuery([customer]))
      .mockReturnValueOnce(createMockQuery([plan]));

    const mockHandler = {
      disconnectCustomer: vi.fn().mockResolvedValue(undefined),
    };
    mockGetDeviceHandler.mockReturnValue(mockHandler);

    const req = buildRequest('POST', '/api/customers/cust-1/disconnect');
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data.disconnected).toBe(true);
    expect(mockHandler.disconnectCustomer).toHaveBeenCalled();
  });

  it('returns 404 when customer not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([]));

    const req = buildRequest('POST', '/api/customers/cust-1/disconnect');
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.status).toBe('error');
  });

  it('returns 404 when plan not found', async () => {
    const customer = buildCustomer({ id: 'cust-1' });
    mockDb.select
      .mockReturnValueOnce(createMockQuery([customer]))
      .mockReturnValueOnce(createMockQuery([]));

    const req = buildRequest('POST', '/api/customers/cust-1/disconnect');
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.status).toBe('error');
  });
});
