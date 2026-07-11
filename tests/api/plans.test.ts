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

import { GET, POST } from '@/app/api/plans/route';
import { buildSession, buildPlan, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

describe('GET /api/plans', () => {
  const session = buildSession();
  beforeEach(() => { vi.clearAllMocks(); mockGetSession.mockResolvedValue(session); });

  it('returns all plans', async () => {
    mockRouterOwnerFilter.mockReturnValue(undefined);
    mockDb.select.mockReturnValue(createMockQuery([{ id: 'plan-1', name: 'Plan 1', routerName: 'Router 1', type: 'hotspot', routerId: 'router-1', sharedUsers: 1, validity: 30, price: '0', enabled: true, rateLimitDown: null, rateLimitUp: null, burstLimit: null, timeLimit: null, dataLimit: null, poolId: null, createdAt: new Date(), updatedAt: new Date() }]));
    const res = await GET(buildRequest('GET', '/api/plans'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('applies owner filter when present', async () => {
    mockRouterOwnerFilter.mockReturnValue(vi.fn());
    mockDb.select.mockReturnValue(createMockQuery([]));
    await GET(buildRequest('GET', '/api/plans'));
    expect(mockRouterOwnerFilter).toHaveBeenCalledWith(session);
  });

  it('returns 500 when session throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Unauthorized'));
    const res = await GET(buildRequest('GET', '/api/plans'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/plans', () => {
  const session = buildSession();
  beforeEach(() => { vi.clearAllMocks(); mockGetSession.mockResolvedValue(session); mockRouterOwnerFilter.mockReturnValue(undefined); });

  it('creates a plan successfully', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildPlan({ id: 'plan-new' })]));
    const handler = { addPlan: vi.fn().mockResolvedValue(undefined) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await POST(buildRequest('POST', '/api/plans', { name: 'New Plan', type: 'hotspot', routerId: 'router-1', validity: 30, price: 50000 }), {} as any);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.status).toBe('success');
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it('verifies router ownership when ownerFilter is present', async () => {
    mockRouterOwnerFilter.mockReturnValue(vi.fn());
    mockDb.select.mockReturnValueOnce(createMockQuery([{ id: 'router-1' }]));
    mockDb.select.mockReturnValueOnce(createMockQuery([buildPlan({ id: 'plan-new' })]));
    const handler = { addPlan: vi.fn().mockResolvedValue(undefined) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await POST(buildRequest('POST', '/api/plans', { name: 'New Plan', type: 'hotspot', routerId: 'router-1', validity: 30, price: 10000 }), {} as any);
    expect(res.status).toBe(201);
  });

  it('returns 404 when router ownership check fails', async () => {
    mockRouterOwnerFilter.mockReturnValue(vi.fn());
    mockDb.select.mockReturnValueOnce(createMockQuery([]));
    const res = await POST(buildRequest('POST', '/api/plans', { name: 'New Plan', type: 'hotspot', routerId: 'router-1', validity: 30, price: 10000 }), {} as any);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid payload', async () => {
    const res = await POST(buildRequest('POST', '/api/plans', {}), {} as any);
    expect(res.status).toBe(400);
  });

  it('returns plan with warning when device handler throws', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildPlan({ id: 'plan-new' })]));
    const handler = { addPlan: vi.fn().mockRejectedValue(new Error('Router unreachable')) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await POST(buildRequest('POST', '/api/plans', { name: 'New Plan', type: 'hotspot', routerId: 'router-1', validity: 30, price: 10000 }), {} as any);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.warning).toBeDefined();
  });
});
