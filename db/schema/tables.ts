import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  bigint,
  numeric,
  index,
} from 'drizzle-orm/pg-core';
import {
  roleEnum,
  routerStatusEnum,
  planTypeEnum,
  customerStatusEnum,
  transactionTypeEnum,
} from './enums';

// ── App Users (managed by BetterAuth) ─────────────────────────────
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name'),
  role: roleEnum('role').notNull().default('admin'),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── BetterAuth managed tables ─────────────────────────────────────
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  password: text('password'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Routers ───────────────────────────────────────────────────────
export const routers = pgTable(
  'router',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    name: text('name').notNull().unique(),
    host: text('host').notNull(),
    apiPort: integer('api_port').notNull().default(8729),
    username: text('username').notNull(),
    encryptedPassword: text('encrypted_password').notNull(),
    encryptionIv: text('encryption_iv').notNull(),
    encryptionTag: text('encryption_tag').notNull(),
    tlsFingerprint: text('tls_fingerprint'),
    tlsVerified: boolean('tls_verified').notNull().default(false),
    status: routerStatusEnum('status').notNull().default('unknown'),
    lastSeen: timestamp('last_seen', { withTimezone: true }),
    description: text('description'),
    enabled: boolean('enabled').notNull().default(true),
    createdBy: text('created_by').references(() => user.id),
    updatedBy: text('updated_by').references(() => user.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('router_status_idx').on(t.status)],
);

// ── IP Pools ──────────────────────────────────────────────────────
export const pools = pgTable('pool', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  routerId: text('router_id')
    .notNull()
    .references(() => routers.id, { onDelete: 'cascade' }),
  ranges: text('ranges').notNull(),
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Plans ─────────────────────────────────────────────────────────
export const plans = pgTable('plan', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: planTypeEnum('type').notNull().default('hotspot'),
  routerId: text('router_id')
    .notNull()
    .references(() => routers.id, { onDelete: 'cascade' }),
  sharedUsers: integer('shared_users').notNull().default(1),
  rateLimitDown: text('rate_limit_down'),
  rateLimitUp: text('rate_limit_up'),
  burstLimit: text('burst_limit'),
  timeLimit: integer('time_limit'),
  dataLimit: bigint('data_limit', { mode: 'bigint' }),
  validity: integer('validity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  enabled: boolean('enabled').notNull().default(true),
  poolId: text('pool_id').references(() => pools.id, { onDelete: 'set null' }),
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Customers ─────────────────────────────────────────────────────
export const customers = pgTable(
  'customer',
  {
    id: text('id').primaryKey(),
    username: text('username').notNull(),
    password: text('password').notNull(),
    fullName: text('full_name'),
    email: text('email'),
    phone: text('phone'),
    routerId: text('router_id')
      .notNull()
      .references(() => routers.id, { onDelete: 'cascade' }),
    planId: text('plan_id').references(() => plans.id, { onDelete: 'set null' }),
    status: customerStatusEnum('status').notNull().default('active'),
    macAddress: text('mac_address'),
    ipAddress: text('ip_address'),
    expiredAt: timestamp('expired_at', { withTimezone: true }),
    createdBy: text('created_by').references(() => user.id),
    updatedBy: text('updated_by').references(() => user.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('customer_router_idx').on(t.routerId), index('customer_status_idx').on(t.status)],
);

// ── Recharges ─────────────────────────────────────────────────────
export const userRecharges = pgTable('user_recharge', {
  id: text('id').primaryKey(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  planId: text('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  routerId: text('router_id')
    .notNull()
    .references(() => routers.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  expiredAt: timestamp('expired_at', { withTimezone: true }).notNull(),
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Vouchers ──────────────────────────────────────────────────────
export const vouchers = pgTable('voucher', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  planId: text('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  routerId: text('router_id')
    .notNull()
    .references(() => routers.id, { onDelete: 'cascade' }),
  used: boolean('used').notNull().default(false),
  usedAt: timestamp('used_at', { withTimezone: true }),
  customerId: text('customer_id'),
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Transactions ──────────────────────────────────────────────────
export const transactions = pgTable('transaction', {
  id: text('id').primaryKey(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  planId: text('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'cascade' }),
  routerId: text('router_id')
    .notNull()
    .references(() => routers.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  gateway: text('gateway'),
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
