import { NextRequest } from 'next/server';

interface UserFields {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionFields {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionResult {
  user: UserFields;
  session: SessionFields;
}

export function buildSession(overrides?: Partial<SessionResult>): SessionResult {
  const now = new Date();
  const defaults: SessionResult = {
    user: {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
    session: {
      id: 'session-1',
      token: 'token-1',
      userId: 'user-1',
      expiresAt: new Date(now.getTime() + 86400000),
      createdAt: now,
      updatedAt: now,
    },
  };
  return mergeDeep(
    defaults as unknown as Record<string, unknown>,
    (overrides ?? {}) as Record<string, unknown>,
  ) as unknown as SessionResult;
}

// ── Customer ──────────────────────────────────────────────────────
interface CustomerFields {
  id: string;
  username: string;
  password: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  routerId: string;
  planId: string | null;
  status: 'active' | 'expired' | 'disabled';
  macAddress: string | null;
  ipAddress: string | null;
  expiredAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function buildCustomer(overrides?: Partial<CustomerFields>): CustomerFields {
  const now = new Date();
  const defaults: CustomerFields = {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'testuser',
    password: 'testpass',
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    routerId: 'router-1',
    planId: 'plan-1',
    status: 'active',
    macAddress: null,
    ipAddress: null,
    expiredAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: now,
    updatedAt: now,
  };
  return { ...defaults, ...overrides };
}

// ── Plan ──────────────────────────────────────────────────────────
interface PlanFields {
  id: string;
  name: string;
  type: 'hotspot' | 'pppoe';
  routerId: string;
  sharedUsers: number;
  rateLimitDown: string | null;
  rateLimitUp: string | null;
  burstLimit: string | null;
  timeLimit: number | null;
  dataLimit: bigint | null;
  validity: number;
  price: string;
  enabled: boolean;
  poolId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function buildPlan(overrides?: Partial<PlanFields>): PlanFields {
  const now = new Date();
  const defaults: PlanFields = {
    id: 'plan-1',
    name: 'Test Plan',
    type: 'hotspot',
    routerId: 'router-1',
    sharedUsers: 1,
    rateLimitDown: null,
    rateLimitUp: null,
    burstLimit: null,
    timeLimit: null,
    dataLimit: null,
    validity: 30,
    price: '0',
    enabled: true,
    poolId: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: now,
    updatedAt: now,
  };
  return { ...defaults, ...overrides };
}

// ── Router ────────────────────────────────────────────────────────
interface RouterFields {
  id: string;
  userId: string;
  name: string;
  host: string;
  apiPort: number;
  username: string;
  encryptedPassword: string;
  encryptionIv: string;
  encryptionTag: string;
  tlsFingerprint: string | null;
  tlsVerified: boolean;
  status: 'online' | 'offline' | 'unknown';
  lastSeen: Date | null;
  description: string | null;
  enabled: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function buildRouter(overrides?: Partial<RouterFields>): RouterFields {
  const now = new Date();
  const defaults: RouterFields = {
    id: 'router-1',
    userId: 'user-1',
    name: 'Test Router',
    host: '192.168.88.1',
    apiPort: 8729,
    username: 'admin',
    encryptedPassword: 'encrypted',
    encryptionIv: 'iv',
    encryptionTag: 'tag',
    tlsFingerprint: null,
    tlsVerified: false,
    status: 'unknown',
    lastSeen: null,
    description: null,
    enabled: true,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    createdAt: now,
    updatedAt: now,
  };
  return { ...defaults, ...overrides };
}

// ── Request builder ───────────────────────────────────────────────
export function buildRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>,
): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ── Helpers ───────────────────────────────────────────────────────
function mergeDeep<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const val = source[key];
    if (val !== undefined) {
      if (
        typeof val === 'object' &&
        val !== null &&
        !Array.isArray(val) &&
        !(val instanceof Date) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key]) &&
        !(result[key] instanceof Date)
      ) {
        result[key] = mergeDeep(
          result[key] as Record<string, unknown>,
          val as Record<string, unknown>,
        ) as T[keyof T];
      } else {
        result[key] = val as T[keyof T];
      }
    }
  }
  return result;
}
