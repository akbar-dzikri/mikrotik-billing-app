import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockRouterOwnerWhere } = vi.hoisted(() => ({
  mockGetSession: vi.fn(), mockRouterOwnerWhere: vi.fn(),
}));

const { mockDb } = vi.hoisted(() => {
  const dq: any = { from: vi.fn().mockReturnThis(), leftJoin: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), offset: vi.fn().mockReturnThis(), values: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), then(r: any) { r([]); }, catch() {}, finally() {} };
  return { mockDb: { select: vi.fn(() => dq), insert: vi.fn(() => dq), update: vi.fn(() => dq), delete: vi.fn(() => dq) } };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth-helpers', () => ({ getSession: mockGetSession, routerOwnerWhere: mockRouterOwnerWhere }));

const { mockGetRouterClient } = vi.hoisted(() => ({ mockGetRouterClient: vi.fn() }));
vi.mock('@/lib/mikrotik-client', () => ({ getRouterClient: mockGetRouterClient }));

import { POST } from '@/app/api/routers/[id]/test/route';
import { buildSession, buildRouter, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

const params = Promise.resolve({ id: 'router-1' });

describe('POST /api/routers/[id]/test', () => {
  const session = buildSession();
  beforeEach(() => { vi.clearAllMocks(); mockGetSession.mockResolvedValue(session); mockRouterOwnerWhere.mockImplementation((_s: any, c: any) => c); });

  it('tests connection successfully', async () => {
    mockDb.select.mockReturnValue(createMockQuery([buildRouter({ id: 'router-1', host: '192.168.88.1' })]));
    const client = { write: vi.fn().mockResolvedValue([]), close: vi.fn() };
    mockGetRouterClient.mockResolvedValue(client);
    const res = await POST(buildRequest('POST', '/api/routers/router-1/test'), { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.status).toBe('online');
    expect(body.data.latency).toBeGreaterThanOrEqual(0);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('returns 503 when connection fails', async () => {
    mockDb.select.mockReturnValue(createMockQuery([buildRouter({ id: 'router-1' })]));
    mockGetRouterClient.mockRejectedValue(new Error('Connection timeout'));
    const res = await POST(buildRequest('POST', '/api/routers/router-1/test'), { params });
    expect(res.status).toBe(503);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('returns 404 when router not found', async () => {
    mockDb.select.mockReturnValue(createMockQuery([]));
    const res = await POST(buildRequest('POST', '/api/routers/router-1/test'), { params });
    expect(res.status).toBe(404);
  });
});
