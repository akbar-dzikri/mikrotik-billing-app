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

import { GET, PUT, DELETE } from '@/app/api/plans/[id]/route';
import { buildSession, buildPlan, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

const params = Promise.resolve({ id: 'plan-1' });

describe('GET /api/plans/[id]', () => {
  const session = buildSession();
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session);
    mockRouterOwnerFilter.mockReturnValue(undefined);
  });

  it('returns a plan by id', async () => {
    mockDb.select.mockReturnValue(
      createMockQuery([
        {
          id: 'plan-1',
          name: 'Test Plan',
          type: 'hotspot',
          routerId: 'router-1',
          routerName: 'Test Router',
          sharedUsers: 1,
          validity: 30,
          price: '0',
          enabled: true,
          rateLimitDown: null,
          rateLimitUp: null,
          burstLimit: null,
          timeLimit: null,
          dataLimit: null,
          poolId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    );
    const res = await GET(buildRequest('GET', '/api/plans/plan-1'), { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.id).toBe('plan-1');
  });

  it('returns 404 when plan not found', async () => {
    mockDb.select.mockReturnValue(createMockQuery([]));
    const res = await GET(buildRequest('GET', '/api/plans/plan-1'), { params });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/plans/[id]', () => {
  const session = buildSession();
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session);
    mockRouterOwnerFilter.mockReturnValue(undefined);
  });

  it('updates a plan', async () => {
    mockDb.select.mockReturnValueOnce(
      createMockQuery([buildPlan({ id: 'plan-1', name: 'Old Plan' })]),
    );
    mockDb.select.mockReturnValueOnce(
      createMockQuery([buildPlan({ id: 'plan-1', name: 'Updated Plan' })]),
    );
    const handler = { updatePlan: vi.fn().mockResolvedValue(undefined) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await PUT(buildRequest('PUT', '/api/plans/plan-1', { name: 'Updated Plan' }), {
      params,
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.name).toBe('Updated Plan');
  });

  it('returns 404 when plan not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([]));
    const res = await PUT(buildRequest('PUT', '/api/plans/plan-1', { name: 'Updated Plan' }), {
      params,
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid payload', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildPlan({ id: 'plan-1' })]));
    const res = await PUT(buildRequest('PUT', '/api/plans/plan-1', { name: '' }), { params });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/plans/[id]', () => {
  const session = buildSession();
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session);
    mockRouterOwnerFilter.mockReturnValue(undefined);
  });

  it('deletes a plan', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildPlan({ id: 'plan-1' })]));
    const handler = { removePlan: vi.fn().mockResolvedValue(undefined) };
    mockGetDeviceHandler.mockReturnValue(handler);
    const res = await DELETE(buildRequest('DELETE', '/api/plans/plan-1'), { params });
    expect(res.status).toBe(200);
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when plan not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([]));
    const res = await DELETE(buildRequest('DELETE', '/api/plans/plan-1'), { params });
    expect(res.status).toBe(404);
  });
});
