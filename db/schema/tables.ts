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

// ── Storefront ────────────────────────────────────────────────────
// These tables support the public customer-facing storefront (beli/:slug, voucher/:token).
// They are SEPARATE from the admin tables above — same DB, different concerns.
//
//   Admin tables (above)          |  Storefront tables (below)
//   ──────────────────────────────|────────────────────────────────
//   routers (API-SSL, per-admin)  |  mikrotik_configs (REST, per-tenant)
//   plans (rate limits, pools)    |  store_packages (simple SKUs, links to plan)
//   customers (full CRM)          |  orders (customer_name, wa_number inline)
//   vouchers (pre-generated)      |  store_vouchers (per-order, generated on payment)
//   user_recharge                 |  orders (fulfillment flow)
//
// store_packages optionally link to plans via planId — a storefront SKU
// can map to an admin plan to reuse hotspot profiles on the router.
export const tenants = pgTable('tenant', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline'),
  brandColor: text('brand_color'),
  waSupport: text('wa_support'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const storePackages = pgTable('store_package', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  planId: text('plan_id').references(() => plans.id),
  priceIdr: integer('price_idr').notNull(),
  durationLabel: text('duration_label').notNull(),
  hotspotProfile: text('hotspot_profile'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const orders = pgTable('order', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  packageId: text('package_id')
    .notNull()
    .references(() => storePackages.id),
  customerName: text('customer_name').notNull(),
  waNumber: text('wa_number').notNull(),
  amountIdr: integer('amount_idr').notNull(),
  status: text('status').notNull().default('pending'),
  paymentRef: text('payment_ref'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  mikrotikSyncedAt: timestamp('mikrotik_synced_at', { withTimezone: true }),
  mikrotikError: text('mikrotik_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const storeVouchers = pgTable('store_voucher', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  username: text('username').notNull(),
  password: text('password').notNull(),
  hotspotProfile: text('hotspot_profile'),
  mikrotikSyncedAt: timestamp('mikrotik_synced_at', { withTimezone: true }),
  mikrotikError: text('mikrotik_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const deliveryLogs = pgTable('delivery_log', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  provider: text('provider').notNull(),
  status: text('status').notNull(),
  response: text('response'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Per-tenant storefront router configs (REST-based, encrypted with STOREFRONT_ENCRYPTION_KEY).
// Separate from admin 'routers' table (API-SSL, encrypted with ROUTER_ENCRYPTION_KEY).
export const mikrotikConfigs = pgTable('mikrotik_config', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .unique()
    .references(() => tenants.id),
  host: text('host').notNull(),
  port: integer('port').notNull().default(8729),
  useHttps: boolean('use_https').notNull().default(true),
  username: text('username').notNull(),
  passwordEnc: text('password_enc').notNull(),
  defaultProfile: text('default_profile'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const waConfigs = pgTable('wa_config', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .unique()
    .references(() => tenants.id),
  cloudPhoneId: text('cloud_phone_id'),
  cloudTokenEnc: text('cloud_token_enc'),
  cloudTemplateName: text('cloud_template_name'),
  fonnteTokenEnc: text('fonnte_token_enc'),
  wablasTokenEnc: text('wablas_token_enc'),
  wablasDomain: text('wablas_domain'),
  providerOrder: text('provider_order').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
