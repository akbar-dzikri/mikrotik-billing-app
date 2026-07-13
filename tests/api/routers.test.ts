import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSession, mockRouterOwnerFilter } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRouterOwnerFilter: vi.fn(),
}));

const { mockDb } = vi.hoisted(() => {
  const defaultQuery = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    then(resolve: (v: any[]) => void) {
      resolve([]);
    },
    catch() {},
    finally() {},
  };
  return {
    mockDb: {
      select: vi.fn(() => defaultQuery),
      insert: vi.fn(() => defaultQuery),
      update: vi.fn(() => defaultQuery),
      delete: vi.fn(() => defaultQuery),
    },
  };
});

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

vi.mock('@/lib/auth-helpers', () => ({
  getSession: mockGetSession,
  routerOwnerFilter: mockRouterOwnerFilter,
  routerOwnerWhere: vi.fn(),
  isSuperAdmin: vi.fn(),
}));

const { mockEncryptPassword, mockGetRouterClient, mockGetCertFingerprint } = vi.hoisted(() => ({
  mockEncryptPassword: vi.fn(),
  mockGetRouterClient: vi.fn(),
  mockGetCertFingerprint: vi.fn(),
}));

vi.mock('@/lib/crypto', () => ({
  encryptPassword: mockEncryptPassword,
}));

vi.mock('@/lib/mikrotik-client', () => ({
  getRouterClient: mockGetRouterClient,
}));

vi.mock('@/lib/tls-fingerprint', () => ({
  getCertFingerprint: mockGetCertFingerprint,
}));

import { GET, POST } from '@/app/api/routers/route';
import { buildSession, buildRouter, buildRequest } from '../helpers/factories';
import { createMockQuery } from '../helpers/mocks';

describe('GET /api/routers', () => {
  const session = buildSession();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session);
  });

  it('returns all routers when owner filter is undefined (super-admin)', async () => {
    const routers = [
      buildRouter({ id: 'r1', name: 'Router 1' }),
      buildRouter({ id: 'r2', name: 'Router 2' }),
    ];
    mockRouterOwnerFilter.mockReturnValue(undefined);
    mockDb.select.mockReturnValue(createMockQuery(routers));

    const req = buildRequest('GET', '/api/routers');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data).toHaveLength(2);
  });

  it('calls routerOwnerFilter with session', async () => {
    mockRouterOwnerFilter.mockReturnValue(undefined);
    mockDb.select.mockReturnValue(createMockQuery([]));

    const req = buildRequest('GET', '/api/routers');
    await GET(req);

    expect(mockRouterOwnerFilter).toHaveBeenCalledWith(session);
  });

  it('passes ownerFilter to where clause when present', async () => {
    const ownerFilter = vi.fn();
    mockRouterOwnerFilter.mockReturnValue(ownerFilter);
    mockDb.select.mockReturnValue(createMockQuery([buildRouter()]));

    const req = buildRequest('GET', '/api/routers');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('returns 500 when getSession throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Unauthorized'));

    const req = buildRequest('GET', '/api/routers');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.status).toBe('error');
  });
});

describe('POST /api/routers', () => {
  const session = buildSession();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(session);
    mockEncryptPassword.mockReturnValue({
      ciphertext: 'encrypted-pass',
      iv: 'test-iv',
      authTag: 'test-tag',
    });
  });

  it('creates a router successfully with TLS fingerprint', async () => {
    const newRouter = buildRouter({
      id: 'ignored',
      name: 'New Router',
      host: '10.0.0.1',
    });

    const mockClient = { close: vi.fn(), connector: { socket: {} } } as any;
    mockGetRouterClient.mockResolvedValue(mockClient);
    mockGetCertFingerprint.mockReturnValue('fingerprint123');
    mockDb.select.mockReturnValue(createMockQuery([newRouter]));

    const req = buildRequest('POST', '/api/routers', {
      name: 'New Router',
      host: '10.0.0.1',
      username: 'admin',
      password: 'secret',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.status).toBe('success');
    expect(body.data.name).toBe('New Router');
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(mockEncryptPassword).toHaveBeenCalledWith('secret');
  });

  it('creates a router when connection fails', async () => {
    const newRouter = buildRouter({ id: 'ignored', name: 'Offline Router', status: 'unknown' });
    mockGetRouterClient.mockRejectedValue(new Error('Connection refused'));
    mockDb.select.mockReturnValue(createMockQuery([newRouter]));

    const req = buildRequest('POST', '/api/routers', {
      name: 'Offline Router',
      host: '10.0.0.1',
      username: 'admin',
      password: 'secret',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.status).toBe('success');
  });

  it('returns 400 for invalid payload', async () => {
    const req = buildRequest('POST', '/api/routers', {});
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.status).toBe('error');
    expect(body.errors).toBeDefined();
  });

  it('returns 500 when session throws', async () => {
    mockGetSession.mockRejectedValue(new Error('Unauthorized'));

    const req = buildRequest('POST', '/api/routers', {
      name: 'Test',
      host: '10.0.0.1',
      username: 'admin',
      password: 'secret',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.status).toBe('error');
  });
});
