import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockRouterOwnerWhere, mockRouterOwnerFilter } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRouterOwnerWhere: vi.fn(),
  mockRouterOwnerFilter: vi.fn(),
}));

const { mockDb } = vi.hoisted(() => {
  const dq = { from: vi.fn().mockReturnThis(), leftJoin: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), offset: vi.fn().mockReturnThis(), values: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), then(r: (v: any[]) => void) { r([]); }, catch() {}, finally() {} };
  return { mockDb: { select: vi.fn(() => dq), insert: vi.fn(() => dq), update: vi.fn(() => dq), delete: vi.fn(() => dq) } };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));

vi.mock('@/lib/auth-helpers', () => ({
  getSession: mockGetSession, routerOwnerWhere: mockRouterOwnerWhere, routerOwnerFilter: mockRouterOwnerFilter,
}));

const { mockEncryptPassword } = vi.hoisted(() => ({ mockEncryptPassword: vi.fn() }));
vi.mock('@/lib/crypto', () => ({ encryptPassword: mockEncryptPassword }));

import { GET, PUT, DELETE } from '@/app/api/routers/[id]/route';
import { buildSession, buildRouter, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

const params = Promise.resolve({ id: 'router-1' });

describe('GET /api/routers/[id]', () => {
  const session = buildSession();
  beforeEach(() => { vi.clearAllMocks(); mockGetSession.mockResolvedValue(session); mockRouterOwnerWhere.mockImplementation((_s: any, c: any) => c); });

  it('returns a router by id', async () => {
    mockDb.select.mockReturnValue(createMockQuery([buildRouter({ id: 'router-1', name: 'My Router' })]));
    const res = await GET(buildRequest('GET', '/api/routers/router-1'), { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data.id).toBe('router-1');
  });

  it('returns 404 when router not found', async () => {
    mockDb.select.mockReturnValue(createMockQuery([]));
    const res = await GET(buildRequest('GET', '/api/routers/router-1'), { params });
    expect(res.status).toBe(404);
  });

  it('returns 500 when session throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Unauthorized'));
    const res = await GET(buildRequest('GET', '/api/routers/router-1'), { params });
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/routers/[id]', () => {
  const session = buildSession();
  beforeEach(() => { vi.clearAllMocks(); mockGetSession.mockResolvedValue(session); mockRouterOwnerWhere.mockImplementation((_s: any, c: any) => c); });

  it('updates a router', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildRouter({ id: 'router-1', name: 'Old Name' })]));
    mockDb.select.mockReturnValueOnce(createMockQuery([buildRouter({ id: 'router-1', name: 'New Name' })]));
    const res = await PUT(buildRequest('PUT', '/api/routers/router-1', { name: 'New Name' }), { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.name).toBe('New Name');
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when router not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([]));
    const res = await PUT(buildRequest('PUT', '/api/routers/router-1', { name: 'New Name' }), { params });
    expect(res.status).toBe(404);
  });

  it('re-encrypts password when password is provided', async () => {
    mockEncryptPassword.mockReturnValue({ ciphertext: 'new-encrypted', iv: 'new-iv', authTag: 'new-tag' });
    mockDb.select.mockReturnValueOnce(createMockQuery([buildRouter({ id: 'router-1' })]));
    mockDb.select.mockReturnValueOnce(createMockQuery([buildRouter({ id: 'router-1' })]));
    const res = await PUT(buildRequest('PUT', '/api/routers/router-1', { password: 'new-secret' }), { params });
    expect(res.status).toBe(200);
    expect(mockEncryptPassword).toHaveBeenCalledWith('new-secret');
  });

  it('returns 400 for invalid payload', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildRouter({ id: 'router-1' })]));
    const res = await PUT(buildRequest('PUT', '/api/routers/router-1', { name: '' }), { params });
    expect(res.status).toBe(400);
  });

  it('returns 500 when session throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Unauthorized'));
    const res = await PUT(buildRequest('PUT', '/api/routers/router-1', { name: 'Test' }), { params });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/routers/[id]', () => {
  const session = buildSession();
  beforeEach(() => { vi.clearAllMocks(); mockGetSession.mockResolvedValue(session); mockRouterOwnerWhere.mockImplementation((_s: any, c: any) => c); });

  it('deletes a router', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([buildRouter({ id: 'router-1' })]));
    const res = await DELETE(buildRequest('DELETE', '/api/routers/router-1'), { params });
    expect(res.status).toBe(200);
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when router not found', async () => {
    mockDb.select.mockReturnValueOnce(createMockQuery([]));
    const res = await DELETE(buildRequest('DELETE', '/api/routers/router-1'), { params });
    expect(res.status).toBe(404);
  });
});
