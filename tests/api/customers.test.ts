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

import { GET, POST } from '@/app/api/customers/route';
import { buildSession, buildCustomer, buildPlan, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

describe('GET /api/customers', () => {
  const session = buildSession();
  beforeEach(() => { vi.clearAllMocks(); mockGetSession.mockResolvedValue(session); });

  it('returns all customers', async () => {
    mockRouterOwnerFilter.mockReturnValue(undefined);
    mockDb.select.mockReturnValue(createMockQuery([{ id: 'cust-1', username: 'user1', fullName: 'User 1', email: null, phone: null, routerId: 'router-1', routerName: 'Router 1', planId: 'plan-1', planName: 'Plan 1', planType: 'hotspot', status: 'active', macAddress: null, ipAddress: null, expiredAt: null, createdAt: new Date(), updatedAt: new Date() }]));
    const res = await GET(buildRequest('GET', '/api/customers'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('applies owner filter when present', async () => {
    mockRouterOwnerFilter.mockReturnValue(vi.fn());
    mockDb.select.mockReturnValue(createMockQuery([]));
    await GET(buildRequest('GET', '/api/customers'));
    expect(mockRouterOwnerFilter).toHaveBeenCalledWith(session);
  });
});

describe('POST /api/customers', () => {
  const session = buildSession();
  beforeEach(() => { vi.clearAllMocks(); mockGetSession.mockResolvedValue(session); mockRouterOwnerFilter.mockReturnValue(undefined); });

  it('creates a customer successfully', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildPlan({ id: 'plan-1' })]));
    const handler = { addCustomer: vi.fn().mockResolvedValue(undefined) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await POST(buildRequest('POST', '/api/customers', { username: 'newuser', password: 'pass123', routerId: 'router-1', planId: 'plan-1' }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.status).toBe('success');
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when plan is not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([]));
    const res = await POST(buildRequest('POST', '/api/customers', { username: 'newuser', password: 'pass123', routerId: 'router-1', planId: 'plan-1' }));
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.message).toBe('Plan not found');
  });

  it('returns 400 for invalid payload', async () => {
    const res = await POST(buildRequest('POST', '/api/customers', {}));
    expect(res.status).toBe(400);
  });

  it('returns 201 with warning when device handler fails', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildPlan({ id: 'plan-1' })]));
    const handler = { addCustomer: vi.fn().mockRejectedValue(new Error('Sync failed')) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await POST(buildRequest('POST', '/api/customers', { username: 'newuser', password: 'pass123', routerId: 'router-1', planId: 'plan-1' }));
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.warning).toBeDefined();
  });

  it('verifies router ownership when ownerFilter is present', async () => {
    mockRouterOwnerFilter.mockReturnValue(vi.fn());
    mockDb.select.mockReturnValueOnce(createMockQuery([{ id: 'router-1' }]));
    mockDb.select.mockReturnValueOnce(createMockQuery([buildPlan({ id: 'plan-1' })]));
    const handler = { addCustomer: vi.fn().mockResolvedValue(undefined) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await POST(buildRequest('POST', '/api/customers', { username: 'newuser', password: 'pass123', routerId: 'router-1', planId: 'plan-1' }));
    expect(res.status).toBe(201);
  });
});
