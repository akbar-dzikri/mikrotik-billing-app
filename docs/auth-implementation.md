# Next.js MikroTik Billing App — Implementation Plan

## 1. Architecture Overview

Two separate authentication domains:

| Layer           | Mechanism                                                           | Responsibility                                                |
| --------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| **App Auth**    | BetterAuth (email/password, session cookie)                         | Dashboard users — who can log in, roles, sessions             |
| **Router Auth** | AES-256-GCM encrypted in DB, decrypted server-side at API call time | MikroTik RouterOS credentials — never exposed to the frontend |

```
┌─────────────────────────────────────────────────┐
│                  Next.js Server                  │
│                                                 │
│  ┌───────────┐  session cookie           ┌──────┐
│  │ BetterAuth │◄─────────────────────────►│      │
│  │  (users)   │                           │  PG  │
│  └───────────┘                            │  DB  │
│                                           │      │
│  ┌──────────────────┐                     │      │
│  │ RouterCredential │  encrypt/decrypt    │      │
│  │    Manager       │◄───────────────────►│      │
│  └────────┬─────────┘                     └──────┘
│           │ decrypt at call time
│  ┌────────▼─────────┐
│  │ MikroTik API     │─────── TLS:8729 ──────► [Router]
│  │ Client            │
│  └──────────────────┘
└─────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer             | Choice                                             |
| ----------------- | -------------------------------------------------- |
| Framework         | Next.js 16+ (App Router)                           |
| Language          | TypeScript                                         |
| Database          | PostgreSQL                                         |
| ORM               | Drizzle ORM (`drizzle-orm` + `drizzle-kit`)       |
| App Auth          | BetterAuth (email/password provider)               |
| Router API Client | `node-routeros` (RouterOS API protocol)            |
| Encryption        | Node.js `crypto` — AES-256-GCM                     |
| TLS Strategy      | Trust-on-first-use (TOFU) + optional Let's Encrypt |
| UI                | Tailwind CSS 4 + daisyUI 5                         |
| Validation        | Zod                                                |
| Package Manager   | pnpm                                               |

---

## 3. Database Schema (Drizzle)

### 3.1 Custom Enums

```typescript
// db/schema/enums.ts
import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["super_admin", "admin"]);
export const routerStatusEnum = pgEnum("router_status", ["online", "offline", "unknown"]);
export const planTypeEnum = pgEnum("plan_type", ["hotspot", "pppoe"]);
export const customerStatusEnum = pgEnum("customer_status", ["active", "expired", "disabled"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["recharge", "voucher", "refund"]);
```

### 3.2 Tables

```typescript
// db/schema/tables.ts
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  bigint,
  numeric,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import {
  roleEnum,
  routerStatusEnum,
  planTypeEnum,
  customerStatusEnum,
  transactionTypeEnum,
} from "./enums";

// ── App Users (dashboard admins) ──────────────────────────────────
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  name: text("name"),
  role: roleEnum("role").notNull().default("admin"),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// BetterAuth managed tables (created by BetterAuth CLI / migrations):
// - session (id, userId, token, expiresAt, ipAddress, userAgent, createdAt, updatedAt)
// - account (id, userId, accountId, providerId, password, accessToken, refreshToken,
//            expiresAt, createdAt, updatedAt)
// - verification (id, identifier, value, expiresAt, createdAt, updatedAt)

// ── Routers ───────────────────────────────────────────────────────
export const routers = pgTable(
  "router",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    host: text("host").notNull(),
    apiPort: integer("api_port").notNull().default(8729),
    username: text("username").notNull(),
    encryptedPassword: text("encrypted_password").notNull(),
    encryptionIv: text("encryption_iv").notNull(),
    encryptionTag: text("encryption_tag").notNull(),
    tlsFingerprint: text("tls_fingerprint"),
    tlsVerified: boolean("tls_verified").notNull().default(false),
    status: routerStatusEnum("status").notNull().default("unknown"),
    lastSeen: timestamp("last_seen", { withTimezone: true }),
    description: text("description"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("router_status_idx").on(t.status)],
);

// ── Plans ─────────────────────────────────────────────────────────
export const plans = pgTable("plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: planTypeEnum("type").notNull().default("hotspot"),
  routerId: text("router_id")
    .notNull()
    .references(() => routers.id, { onDelete: "cascade" }),
  sharedUsers: integer("shared_users").notNull().default(1),
  rateLimitDown: text("rate_limit_down"),
  rateLimitUp: text("rate_limit_up"),
  burstLimit: text("burst_limit"),
  timeLimit: integer("time_limit"),
  dataLimit: bigint("data_limit", { mode: "bigint" }),
  validity: integer("validity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  enabled: boolean("enabled").notNull().default(true),
  poolId: text("pool_id").references(() => pools.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── IP Pools ──────────────────────────────────────────────────────
export const pools = pgTable("pool", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  routerId: text("router_id")
    .notNull()
    .references(() => routers.id, { onDelete: "cascade" }),
  ranges: text("ranges").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Customers ─────────────────────────────────────────────────────
export const customers = pgTable(
  "customer",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    password: text("password").notNull(),
    fullName: text("full_name"),
    email: text("email"),
    phone: text("phone"),
    routerId: text("router_id")
      .notNull()
      .references(() => routers.id, { onDelete: "cascade" }),
    planId: text("plan_id").references(() => plans.id, { onDelete: "set null" }),
    status: customerStatusEnum("status").notNull().default("active"),
    macAddress: text("mac_address"),
    ipAddress: text("ip_address"),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("customer_router_idx").on(t.routerId),
    index("customer_status_idx").on(t.status),
  ],
);

// ── Recharges ─────────────────────────────────────────────────────
export const userRecharges = pgTable("user_recharge", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  routerId: text("router_id")
    .notNull()
    .references(() => routers.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  expiredAt: timestamp("expired_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Vouchers ──────────────────────────────────────────────────────
export const vouchers = pgTable("voucher", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  routerId: text("router_id")
    .notNull()
    .references(() => routers.id, { onDelete: "cascade" }),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at", { withTimezone: true }),
  customerId: text("customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Transactions ──────────────────────────────────────────────────
export const transactions = pgTable("transaction", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  routerId: text("router_id")
    .notNull()
    .references(() => routers.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  gateway: text("gateway"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 3.3 Relations

```typescript
// db/schema/relations.ts
import { relations } from "drizzle-orm";
import { routers, plans, pools, customers, userRecharges, vouchers, transactions } from "./tables";

export const routersRelations = relations(routers, ({ many }) => ({
  plans: many(plans),
  pools: many(pools),
  customers: many(customers),
  vouchers: many(vouchers),
  transactions: many(transactions),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  router: one(routers, { fields: [plans.routerId], references: [routers.id] }),
  pool: one(pools, { fields: [plans.poolId], references: [pools.id] }),
  customers: many(customers),
}));

export const poolsRelations = relations(pools, ({ one, many }) => ({
  router: one(routers, { fields: [pools.routerId], references: [routers.id] }),
  plans: many(plans),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  router: one(routers, { fields: [customers.routerId], references: [routers.id] }),
  plan: one(plans, { fields: [customers.planId], references: [plans.id] }),
  recharges: many(userRecharges),
  transactions: many(transactions),
}));

export const userRechargesRelations = relations(userRecharges, ({ one }) => ({
  customer: one(customers, { fields: [userRecharges.customerId], references: [customers.id] }),
  plan: one(plans, { fields: [userRecharges.planId], references: [plans.id] }),
  router: one(routers, { fields: [userRecharges.routerId], references: [routers.id] }),
}));

export const vouchersRelations = relations(vouchers, ({ one }) => ({
  plan: one(plans, { fields: [vouchers.planId], references: [plans.id] }),
  router: one(routers, { fields: [vouchers.routerId], references: [routers.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  customer: one(customers, { fields: [transactions.customerId], references: [customers.id] }),
  plan: one(plans, { fields: [transactions.planId], references: [plans.id] }),
  router: one(routers, { fields: [transactions.routerId], references: [routers.id] }),
}));
```

### 3.4 BetterAuth Schema Notes

BetterAuth manages its own tables (`user`, `session`, `account`, `verification`). The `user` table defined above aligns with BetterAuth's expected columns. BetterAuth's CLI generates migrations for its tables — our custom tables live alongside them in the same `db/schema/` directory and get exported together for `drizzle-kit` to generate a unified migration.

---

## 4. Encryption Layer

### 4.1 RouterCredential Manager (`lib/crypto.ts`)

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ROUTER_ENCRYPTION_KEY!, "hex"); // 64-char hex string

export function encryptPassword(plaintext: string): {
  ciphertext: string;
  iv: string;
  authTag: string;
} {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
  };
}

export function decryptPassword(
  ciphertext: string,
  iv: string,
  authTag: string,
): string {
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

### 4.2 Key Management

- Generate once: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Store in environment: `ROUTER_ENCRYPTION_KEY=<64-char-hex>`
- Never in the database. Never in source control.
- For production: inject via secrets manager (Vercel env, Doppler, AWS Secrets Manager).
- Key rotation: decrypt all router records with old key, re-encrypt with new key. Script it as a Drizzle migration helper.

---

## 5. TLS Strategy — Trust on First Use (TOFU)

### 5.1 Why TOFU?

MikroTik routers auto-generate self-signed certificates for the API-TLS service on port 8729. Requiring users to manually create or upload certificates is a non-starter for small ISPs and hotspot operators. TOFU gives practical MITM protection with zero user effort.

### 5.2 Flow

```
ADD ROUTER:
  1. User enters host, username, password into the dashboard
  2. Server encrypts password → stores in DB
  3. Server opens TLS connection to router:8729
  4. Extracts SHA-256 fingerprint of the peer certificate
  5. Stores fingerprint in Router.tlsFingerprint
  6. If connection succeeds → status=online, lastSeen=now

EVERY SUBSEQUENT CONNECTION:
  1. Decrypt password from DB
  2. Open TLS connection to router:8729
  3. Compute peer certificate SHA-256 fingerprint
  4. Compare to Router.tlsFingerprint
  5. Match → proceed
  6. Mismatch → throw error, log alert, refuse connection
  7. If tlsVerified=true → use standard PKI validation (Let's Encrypt)
```

### 5.3 Implementation (`lib/tls-fingerprint.ts`)

```typescript
import tls from "tls";
import crypto from "crypto";

export function getCertFingerprint(socket: tls.TLSSocket): string {
  const cert = socket.getPeerCertificate(true);
  if (!cert || !cert.raw) throw new Error("No peer certificate presented");
  return crypto.createHash("sha256").update(cert.raw).digest("hex");
}
```

### 5.4 Optional: Let's Encrypt Automation

If the router has a public domain, trigger enrollment via RouterOS API:

```
POST /api/routers/{id}/letsencrypt
  → RouterOS command: /certificate/enable-ssl-certificate dns-name=router1.isp.com
  → Wait for completion
  → Set Router.tlsVerified = true
  → Subsequent connections use standard TLS PKI validation
```

---

## 6. MikroTik API Client

### 6.1 Connection Manager (`lib/mikrotik-client.ts`)

```typescript
import { createConnection, RosConnection } from "node-routeros";
import { decryptPassword } from "./crypto";
import { getCertFingerprint } from "./tls-fingerprint";
import { db } from "./db";
import { routers } from "@/db/schema/tables";
import { eq } from "drizzle-orm";

interface RouterRecord {
  id: string;
  host: string;
  apiPort: number;
  username: string;
  encryptedPassword: string;
  encryptionIv: string;
  encryptionTag: string;
  tlsFingerprint: string | null;
  tlsVerified: boolean;
}

export async function getRouterClient(
  router: RouterRecord,
): Promise<RosConnection> {
  const password = decryptPassword(
    router.encryptedPassword,
    router.encryptionIv,
    router.encryptionTag,
  );

  const client = await createConnection({
    host: router.host,
    port: router.apiPort,
    user: router.username,
    password,
    tls: router.tlsVerified
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  });

  if (!router.tlsVerified && router.tlsFingerprint) {
    const fingerprint = getCertFingerprint(client.socket as tls.TLSSocket);
    if (fingerprint !== router.tlsFingerprint) {
      client.close();
      throw new Error(
        `TLS fingerprint mismatch for router. Possible MITM attack.`,
      );
    }
  }

  return client;
}

// Connection pool — one persistent connection per router, recreated on failure
const clientPool = new Map<string, RosConnection>();

export async function getOrCreateClient(
  routerId: string,
): Promise<RosConnection> {
  const cached = clientPool.get(routerId);
  if (cached && cached.connected) return cached;

  const [router] = await db.select().from(routers).where(eq(routers.id, routerId)).limit(1);
  if (!router) throw new Error(`Router ${routerId} not found`);

  const client = await getRouterClient(router);
  clientPool.set(routerId, client);
  return client;
}
```

### 6.2 RouterOS Commands Reference

| Operation              | RouterOS Command                         | Key Arguments                                                                 |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Add hotspot user       | `/ip/hotspot/user/add`                   | `name`, `password`, `profile`, `comment`, `limit-uptime`, `limit-bytes-total` |
| Remove hotspot user    | `/ip/hotspot/user/remove`                | `.id` (looked up by `name`)                                                   |
| Set user password      | `/ip/hotspot/user/set`                   | `.id`, `password`                                                             |
| Set user plan/profile  | `/ip/hotspot/user/set`                   | `.id`, `profile`                                                              |
| Online check           | `/ip/hotspot/active/print`               | query `?user=X`                                                               |
| Disconnect user        | `/ip/hotspot/active/remove`              | `.id` (from active session)                                                   |
| Login user             | `/ip/hotspot/active/login`               | `user`, `password`, `ip`, `mac-address`                                       |
| Add hotspot profile    | `/ip/hotspot/user/profile/add`           | `name`, `shared-users`, `rate-limit`                                          |
| Update hotspot profile | `/ip/hotspot/user/profile/set`           | `.id`, `name`, `shared-users`, `rate-limit`                                   |
| Remove hotspot profile | `/ip/hotspot/user/profile/remove`        | `.id`                                                                         |
| Add PPPoE secret       | `/ppp/secret/add`                        | `name`, `service=pppoe`, `profile`, `password`                                |
| Remove PPPoE secret    | `/ppp/secret/remove`                     | `.id` (looked up by `name`)                                                   |
| Disconnect PPPoE user  | `/ppp/active/remove`                     | `.id`                                                                         |
| Add PPPoE profile      | `/ppp/profile/add`                       | `name`, `local-address`, `remote-address`, `rate-limit`                       |
| Update PPPoE profile   | `/ppp/profile/set`                       | `.id`, `rate-limit`, etc.                                                     |
| Remove PPPoE profile   | `/ppp/profile/remove`                    | `.id`                                                                         |
| IP pool CRUD           | `/ip/pool/add`, `/set`, `/remove`        | `name`, `ranges`                                                              |
| Health check           | `/system/resource/print`                 | returns uptime, cpu, memory                                                   |
| Active count           | `/ip/hotspot/active/print` `count-only=` | returns total online users                                                    |

---

## 7. Device Abstraction

### 7.1 Interface (`lib/devices/types.ts`)

```typescript
import type { Customer, Plan, Pool } from "@/db/schema/tables";

export interface DeviceHandler {
  description(): DeviceInfo;

  // Customer operations
  addCustomer(customer: Customer, plan: Plan): Promise<void>;
  removeCustomer(customer: Customer, plan: Plan): Promise<void>;
  onlineCustomer(username: string, routerId: string): Promise<OnlineStatus | null>;
  connectCustomer(
    username: string,
    password: string,
    ip: string,
    macAddress: string,
    routerId: string,
  ): Promise<void>;
  disconnectCustomer(username: string, routerId: string): Promise<void>;
  syncCustomer(customer: Customer, plan: Plan): Promise<void>;

  // Plan operations
  addPlan(plan: Plan): Promise<void>;
  updatePlan(oldPlan: Plan, newPlan: Plan): Promise<void>;
  removePlan(plan: Plan): Promise<void>;

  // Pool operations
  addPool(pool: Pool): Promise<void>;
  updatePool(pool: Pool): Promise<void>;
  removePool(pool: Pool): Promise<void>;
}

export interface DeviceInfo {
  title: string;
  description: string;
  author: string;
  url: string;
}

export interface OnlineStatus {
  sessionId: string;
  ipAddress: string;
  macAddress: string;
  uptime: string;
}
```

### 7.2 Hotspot Handler (`lib/devices/mikrotik-hotspot.ts`)

```typescript
import { getOrCreateClient } from "../mikrotik-client";
import type { DeviceHandler, OnlineStatus } from "./types";
import type { Customer, Plan } from "@/db/schema/tables";

export class MikrotikHotspot implements DeviceHandler {
  description() {
    return {
      title: "MikroTik Hotspot",
      description: "Manage hotspot users and profiles on MikroTik RouterOS",
      author: "PHPNuxBill",
      url: "https://mikrotik.com",
    };
  }

  async addCustomer(customer: Customer, plan: Plan) {
    const client = await getOrCreateClient(customer.routerId);
    const args: string[] = [
      `=name=${customer.username}`,
      `=password=${customer.password}`,
      `=profile=${plan.name}`,
      `=comment=${customer.id}`,
    ];
    if (customer.email) args.push(`=email=${customer.email}`);

    await client.write("/ip/hotspot/user/add", args);
  }

  async removeCustomer(customer: Customer, _plan: Plan) {
    const client = await getOrCreateClient(customer.routerId);

    const users = await client.write("/ip/hotspot/user/print", [
      `?name=${customer.username}`,
      "=.proplist=.id",
    ]);

    if (users.length > 0) {
      await client.write("/ip/hotspot/user/remove", [
        `=.id=${users[0][".id"]}`,
      ]);
    }

    await this._disconnectActive(client, customer.username);
  }

  async onlineCustomer(
    username: string,
    routerId: string,
  ): Promise<OnlineStatus | null> {
    const client = await getOrCreateClient(routerId);
    const active = await client.write("/ip/hotspot/active/print", [
      `?user=${username}`,
    ]);

    if (active.length === 0) return null;

    return {
      sessionId: active[0][".id"],
      ipAddress: active[0].address,
      macAddress: active[0]["mac-address"],
      uptime: active[0].uptime,
    };
  }

  async disconnectCustomer(username: string, routerId: string) {
    const client = await getOrCreateClient(routerId);
    await this._disconnectActive(client, username);
  }

  async connectCustomer(
    username: string,
    password: string,
    ip: string,
    macAddress: string,
    routerId: string,
  ) {
    const client = await getOrCreateClient(routerId);
    await client.write("/ip/hotspot/active/login", [
      `=user=${username}`,
      `=password=${password}`,
      `=ip=${ip}`,
      `=mac-address=${macAddress}`,
    ]);
  }

  async addPlan(plan: Plan) {
    const client = await getOrCreateClient(plan.routerId);
    const rateLimit = `${plan.rateLimitUp || "0"}/${plan.rateLimitDown || "0"}`;

    await client.write("/ip/hotspot/user/profile/add", [
      `=name=${plan.name}`,
      `=shared-users=${plan.sharedUsers}`,
      `=rate-limit=${rateLimit}`,
    ]);
  }

  async updatePlan(oldPlan: Plan, newPlan: Plan) {
    const client = await getOrCreateClient(newPlan.routerId);

    const profiles = await client.write("/ip/hotspot/user/profile/print", [
      `?name=${oldPlan.name}`,
      "=.proplist=.id",
    ]);

    if (profiles.length === 0)
      throw new Error(`Profile "${oldPlan.name}" not found`);

    const rateLimit = `${newPlan.rateLimitUp || "0"}/${newPlan.rateLimitDown || "0"}`;
    await client.write("/ip/hotspot/user/profile/set", [
      `=.id=${profiles[0][".id"]}`,
      `=name=${newPlan.name}`,
      `=shared-users=${newPlan.sharedUsers}`,
      `=rate-limit=${rateLimit}`,
    ]);
  }

  async removePlan(plan: Plan) {
    const client = await getOrCreateClient(plan.routerId);

    const profiles = await client.write("/ip/hotspot/user/profile/print", [
      `?name=${plan.name}`,
      "=.proplist=.id",
    ]);

    if (profiles.length > 0) {
      await client.write("/ip/hotspot/user/profile/remove", [
        `=.id=${profiles[0][".id"]}`,
      ]);
    }
  }

  async syncCustomer(customer: Customer, plan: Plan) {
    const client = await getOrCreateClient(customer.routerId);

    const users = await client.write("/ip/hotspot/user/print", [
      `?name=${customer.username}`,
      "=.proplist=.id,limit-uptime,limit-bytes-total",
    ]);

    if (users.length === 0) {
      await this.addCustomer(customer, plan);
    } else {
      await client.write("/ip/hotspot/user/set", [
        `=.id=${users[0][".id"]}`,
        `=profile=${plan.name}`,
      ]);
    }
  }

  async addPool(pool: Pool) {
    const client = await getOrCreateClient(pool.routerId);
    await client.write("/ip/pool/add", [
      `=name=${pool.name}`,
      `=ranges=${pool.ranges}`,
    ]);
  }

  async updatePool(pool: Pool) {
    const client = await getOrCreateClient(pool.routerId);
    const found = await client.write("/ip/pool/print", [
      `?name=${pool.name}`,
      "=.proplist=.id",
    ]);
    if (found.length > 0) {
      await client.write("/ip/pool/set", [
        `=.id=${found[0][".id"]}`,
        `=ranges=${pool.ranges}`,
      ]);
    }
  }

  async removePool(pool: Pool) {
    const client = await getOrCreateClient(pool.routerId);
    const found = await client.write("/ip/pool/print", [
      `?name=${pool.name}`,
      "=.proplist=.id",
    ]);
    if (found.length > 0) {
      await client.write("/ip/pool/remove", [`=.id=${found[0][".id"]}`]);
    }
  }

  private async _disconnectActive(client: RosConnection, username: string) {
    const active = await client.write("/ip/hotspot/active/print", [
      `?user=${username}`,
      "=.proplist=.id",
    ]);
    for (const session of active) {
      await client.write("/ip/hotspot/active/remove", [
        `=.id=${session[".id"]}`,
      ]);
    }
  }
}
```

### 7.3 Device Resolver (`lib/devices/resolver.ts`)

```typescript
import type { DeviceHandler } from "./types";
import { MikrotikHotspot } from "./mikrotik-hotspot";
// import { MikrotikPppoe } from './mikrotik-pppoe';

export function getDeviceHandler(type: string): DeviceHandler {
  switch (type) {
    case "hotspot":
      return new MikrotikHotspot();
    case "pppoe":
      throw new Error("PPPoE device handler not yet implemented");
    default:
      throw new Error(`Unknown device type: ${type}`);
  }
}
```

---

## 8. API Routes

### 8.1 Router Management

| Method   | Path                            | Description                                                                 |
| -------- | ------------------------------- | --------------------------------------------------------------------------- |
| `GET`    | `/api/routers`                  | List all routers (no passwords in response)                                 |
| `POST`   | `/api/routers`                  | Add router (encrypts password, tests connection, captures TOFU fingerprint) |
| `GET`    | `/api/routers/[id]`             | Get single router                                                           |
| `PUT`    | `/api/routers/[id]`             | Update router (re-encrypt password if changed, clear fingerprint)           |
| `DELETE` | `/api/routers/[id]`             | Delete router                                                               |
| `POST`   | `/api/routers/[id]/test`        | Test connection to router                                                   |
| `POST`   | `/api/routers/[id]/letsencrypt` | Trigger Let's Encrypt enrollment                                            |

### 8.2 Customer Management

| Method   | Path                             | Description                                       |
| -------- | -------------------------------- | ------------------------------------------------- |
| `POST`   | `/api/customers`                 | Add customer → syncs to router via device handler |
| `DELETE` | `/api/customers/[id]`            | Remove from DB and router                         |
| `GET`    | `/api/customers/[id]/online`     | Check if customer is online on router             |
| `POST`   | `/api/customers/[id]/disconnect` | Force disconnect from router                      |
| `POST`   | `/api/customers/recharge`        | Recharge/assign new plan                          |

### 8.3 Plan Management

| Method   | Path              | Description                               |
| -------- | ----------------- | ----------------------------------------- |
| `GET`    | `/api/plans`      | List plans                                |
| `POST`   | `/api/plans`      | Create plan → creates profile on router   |
| `PUT`    | `/api/plans/[id]` | Update plan → updates profile on router   |
| `DELETE` | `/api/plans/[id]` | Delete plan → removes profile from router |

---

## 9. Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/billing"

# BetterAuth
BETTER_AUTH_SECRET="..."               # generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000" # canonical URL

# Router credential encryption
ROUTER_ENCRYPTION_KEY="64-char-hex-string"   # AES-256 key, generate once

# Optional
LOG_LEVEL="info"
```

---

## 10. Directory Structure

```
app/                               # Next.js App Router (no src/ prefix)
├── (dashboard)/                   # Authenticated routes
│   ├── layout.tsx                 # Dashboard shell (sidebar + content)
│   ├── page.tsx                   # Dashboard home
│   ├── routers/                   # Router management pages
│   ├── customers/                 # Customer management pages
│   ├── plans/                     # Plan management pages
│   └── vouchers/                  # Voucher management pages
├── (auth)/                        # Public auth pages
│   └── login/
│       └── page.tsx               # BetterAuth sign-in page
├── api/
│   ├── auth/[...all]/             # BetterAuth API handler
│   ├── routers/                   # Router CRUD + test + letsencrypt
│   ├── customers/                 # Customer CRUD + online/disconnect
│   └── plans/                     # Plan CRUD
├── globals.css                    # Tailwind + daisyUI + design tokens
├── layout.tsx                     # Root layout
└── page.tsx                       # Landing / redirect

lib/
├── auth.ts                        # BetterAuth server client
├── auth-client.ts                 # BetterAuth client (for React hooks)
├── crypto.ts                      # AES-256-GCM encrypt/decrypt
├── tls-fingerprint.ts             # TOFU certificate fingerprinting
├── mikrotik-client.ts             # RouterOS API connection manager
├── db.ts                          # Drizzle client singleton
├── cn.ts                          # clsx + tailwind-merge utility
└── devices/
    ├── types.ts                   # DeviceHandler interface
    ├── resolver.ts                # Device type → handler mapping
    ├── mikrotik-hotspot.ts        # Hotspot device handler
    ├── mikrotik-pppoe.ts          # PPPoE device handler (future)
    └── radius.ts                  # FreeRADIUS device handler (future)

db/
├── schema/
│   ├── enums.ts                   # PostgreSQL enums (role, status, etc.)
│   ├── tables.ts                  # Drizzle table definitions
│   ├── relations.ts               # Drizzle relations
│   └── index.ts                   # Re-exports all
└── migrations/                    # Drizzle Kit generated migrations

components/
├── login-form.tsx                 # BetterAuth sign-in form
├── dashboard/
│   ├── sidebar.tsx                # Sidebar navigation
│   └── ...
└── shared/
    ├── footer.tsx
    └── ...
```

---

## 11. Implementation Order

### Phase 1 — Foundation

1. Scaffold project structure (`app/`, `lib/`, `db/`, `components/`)
2. Install dependencies: `drizzle-orm`, `drizzle-kit`, `better-auth`, `pg`, `node-routeros`, `daisyui`, `zod`, `clsx`, `tailwind-merge`, `bcryptjs`, `date-fns`
3. Set up Drizzle schema (enums, tables, relations) and run initial migration
4. Initialize BetterAuth (email/password provider, generate schema, apply migrations)
5. Configure daisyUI with dark theme + design tokens in `globals.css`
6. Implement `lib/cn.ts` utility (clsx + tailwind-merge)
7. Implement `lib/crypto.ts` (encrypt/decrypt)
8. Implement `lib/tls-fingerprint.ts`
9. Build login page with BetterAuth sign-in form
10. Create dashboard layout with sidebar

### Phase 2 — Router Connectivity

11. Implement `lib/mikrotik-client.ts` (connect, disconnect, pool)
12. Create API routes for router CRUD with TOFU on add
13. Implement router test-connection endpoint
14. Build router management UI pages (daisyUI tables, forms, cards)

### Phase 3 — Device Layer

15. Implement `DeviceHandler` interface
16. Implement `MikrotikHotspot` handler
17. Implement device resolver

### Phase 4 — Plans & Customers

18. Create API routes for plan CRUD (synced to router profiles)
19. Implement customer CRUD (synced to router users)
20. Implement recharge, disconnect, online-check
21. Build plan and customer UI pages

### Phase 5 — Billing

22. Implement voucher generation
23. Implement payments/transactions
24. Dashboard with stats (online users, active sessions)

### Phase 6 — Hardening

25. Connection pooling with auto-reconnect
26. Cron job for router health checks
27. Let's Encrypt automation endpoint
28. Audit logging for all MikroTik operations

---

## 12. Key Design Decisions & Rationale

| Decision                       | Rationale                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RouterOS API over REST**     | TLS on port 8729 works out of the box with auto-generated certs. REST API requires manual setup of `www-ssl` and endpoint configuration. Connection reuse is built into the protocol. |
| **AES-256-GCM**                | Authenticated encryption — detects tampering, prevents chosen-ciphertext attacks. Industry standard.                                                                                  |
| **Trust-on-first-use**         | Zero manual certificate management for end users. Practical MITM protection without requiring domain ownership or CA involvement.                                                     |
| **Port 8729 default**          | Encrypted transport by default. Downgrade to 8728 only if user explicitly opts into insecure mode.                                                                                    |
| **Server-side only**           | Router credentials never touch the browser. All MikroTik calls happen in API routes or server components.                                                                             |
| **Connection pooling**         | Avoids re-logging in for every API call. The RouterOS API login handshake is cheap but unnecessary to repeat.                                                                         |
| **Device plugin pattern**      | Same architecture as PHPNuxBill — makes adding new router types (PPPoE, RADIUS, future protocols) a single class implementation.                                                      |
| **Drizzle over Prisma**        | Lightweight, SQL-like API, no code generation step. Relations are explicit functions, not magic. Better fits the PostgreSQL-first approach.                                            |
| **BetterAuth over NextAuth**   | Framework-agnostic, first-class TypeScript support, built-in email/password provider, simpler session management. No adapter complexity.                                              |
| **daisyUI over shadcn/ui**     | Class-based component library — no component files to maintain, works directly with Tailwind 4, dark theme by default. Faster to iterate.                                             |
| **PostgreSQL over MySQL**      | Better enum support, superior JSON handling, stronger concurrency, and the project standard.                                                                                          |

---

## 13. Security Notes

- **Router passwords are encrypted at rest** — PHPNuxBill stores them plaintext. This is the primary security upgrade.
- **Encryption key lives outside the database** — compromising the DB alone does not expose router credentials.
- **Fingerprint pinning prevents MITM** — even with self-signed certs, an attacker can't impersonate a router after first connection.
- **All transport is TLS** — port 8729 default. Plaintext 8728 is opt-in only.
- **Demo/sandbox mode** — short-circuit all RouterOS calls in development, similar to PHPNuxBill's `$_app_stage == 'demo'` check.
- **BetterAuth sessions** — httpOnly cookies, CSRF protection, and automatic session expiry handled by the library.
