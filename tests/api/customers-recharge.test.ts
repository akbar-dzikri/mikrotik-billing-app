import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockRouterOwnerFilter } = vi.hoisted(() => ({
  mockGetSession: vi.fn(), mockRouterOwnerFilter: vi.fn(),
}));

const { mockDb } = vi.hoisted(() => {
  const dq: any = { from: vi.fn().mockReturnThis(), leftJoin: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), offset: vi.fn().mockReturnThis(), values: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), then(r: any) { r([]); }, catch() {}, finally() {} };
  return { mockDb: { select: vi.fn(() => dq), insert: vi.fn(() => dq), update: vi.fn(() => dq), delete: vi.fn(() => dq) } };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth-helpers', () => ({ getSession: mockGetSession, routerOwnerFilter: mockRouterOwnerFilter }));

const { mockGetDeviceHandler } = vi.hoisted(() => ({ mockGetDeviceHandler: vi.fn() }));
vi.mock('@/lib/devices/resolver', () => ({ getDeviceHandler: mockGetDeviceHandler }));

import { POST } from '@/app/api/customers/recharge/route';
import { buildSession, buildCustomer, buildPlan, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

describe('POST /api/customers/recharge', () => {
  const session = buildSession();
  beforeEach(() => { vi.clearAllMocks(); mockGetSession.mockResolvedValue(session); mockRouterOwnerFilter.mockReturnValue(undefined); });

  it('recharges a customer successfully', async () => {
    const customer = buildCustomer({ id: 'cust-1', status: 'expired', expiredAt: null });
    const plan = buildPlan({ id: 'plan-1', validity: 30 });
    mockDb.select.mockReturnValueOnce(createMockQuery([customer]));
    mockDb.select.mockReturnValueOnce(createMockQuery([plan]));
    const handler = { syncCustomer: vi.fn().mockResolvedValue(undefined) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await POST(buildRequest('POST', '/api/customers/recharge', { customerId: 'cust-1', planId: 'plan-1' }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.data.customerId).toBe('cust-1');
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when customer not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([]));
    const res = await POST(buildRequest('POST', '/api/customers/recharge', { customerId: 'cust-1', planId: 'plan-1' }));
    expect(res.status).toBe(404);
  });

  it('returns 404 when plan not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildCustomer({ id: 'cust-1' })]));
    mockDb.select.mockReturnValueOnce(createMockQuery([]));
    const res = await POST(buildRequest('POST', '/api/customers/recharge', { customerId: 'cust-1', planId: 'plan-1' }));
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid payload', async () => {
    const res = await POST(buildRequest('POST', '/api/customers/recharge', {}));
    expect(res.status).toBe(400);
  });

  it('returns 201 with warning when sync fails', async () => {
    const customer = buildCustomer({ id: 'cust-1', status: 'expired', expiredAt: null });
    const plan = buildPlan({ id: 'plan-1', validity: 30 });
    mockDb.select.mockReturnValueOnce(createMockQuery([customer]));
    mockDb.select.mockReturnValueOnce(createMockQuery([plan]));
    const handler = { syncCustomer: vi.fn().mockRejectedValue(new Error('Sync failed')) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await POST(buildRequest('POST', '/api/customers/recharge', { customerId: 'cust-1', planId: 'plan-1' }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.warning).toBeDefined();
  });
});
