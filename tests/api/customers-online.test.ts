import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockRouterOwnerWhere } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRouterOwnerWhere: vi.fn(),
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
  routerOwnerWhere: mockRouterOwnerWhere,
}));

const { mockGetDeviceHandler } = vi.hoisted(() => ({
  mockGetDeviceHandler: vi.fn(),
}));

vi.mock('@/lib/devices/resolver', () => ({
  getDeviceHandler: mockGetDeviceHandler,
}));

import { GET } from '@/app/api/customers/[id]/online/route';
import { buildSession, buildCustomer, buildPlan, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

const params = Promise.resolve({ id: 'cust-1' });

describe('GET /api/customers/[id]/online', () => {
  const session = buildSession();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session);
    mockRouterOwnerWhere.mockImplementation((_session: any, condition: any) => condition);
  });

  it('returns online status when customer is connected', async () => {
    const row = {
      id: 'cust-1',
      username: 'testuser',
      routerId: 'router-1',
      planId: 'plan-1',
    };
    const plan = buildPlan({ id: 'plan-1' });

    mockDb.select
      .mockReturnValueOnce(createMockQuery([row]))
      .mockReturnValueOnce(createMockQuery([plan]));

    const mockHandler = {
      onlineCustomer: vi.fn().mockResolvedValue({
        sessionId: 'sess-1',
        ipAddress: '192.168.1.100',
        macAddress: '00:11:22:33:44:55',
        uptime: '1h2m3s',
      }),
    };
    mockGetDeviceHandler.mockReturnValue(mockHandler);

    const req = buildRequest('GET', '/api/customers/cust-1/online');
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data.online).toBe(true);
    expect(body.data.session).toBeDefined();
  });

  it('returns offline status when customer is not connected', async () => {
    const row = {
      id: 'cust-1',
      username: 'testuser',
      routerId: 'router-1',
      planId: 'plan-1',
    };
    const plan = buildPlan({ id: 'plan-1' });

    mockDb.select
      .mockReturnValueOnce(createMockQuery([row]))
      .mockReturnValueOnce(createMockQuery([plan]));

    const mockHandler = {
      onlineCustomer: vi.fn().mockResolvedValue(null),
    };
    mockGetDeviceHandler.mockReturnValue(mockHandler);

    const req = buildRequest('GET', '/api/customers/cust-1/online');
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data.online).toBe(false);
    expect(body.data.session).toBeNull();
  });

  it('returns 404 when customer not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([]));

    const req = buildRequest('GET', '/api/customers/cust-1/online');
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.status).toBe('error');
  });
});
