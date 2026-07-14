import { relations } from 'drizzle-orm';
import {
  user,
  session,
  account,
  verification,
  routers,
  plans,
  pools,
  customers,
  userRecharges,
  vouchers,
  transactions,
  tenants,
  storePackages,
  orders,
  storeVouchers,
  deliveryLogs,
  mikrotikConfigs,
  waConfigs,
} from './tables';

// ── BetterAuth relations ──────────────────────────────────────────
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  tenants: many(tenants),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const verificationRelations = relations(verification, () => ({}));

// ── Business relations ────────────────────────────────────────────
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
  customer: one(customers, {
    fields: [userRecharges.customerId],
    references: [customers.id],
  }),
  plan: one(plans, { fields: [userRecharges.planId], references: [plans.id] }),
  router: one(routers, { fields: [userRecharges.routerId], references: [routers.id] }),
}));

export const vouchersRelations = relations(vouchers, ({ one }) => ({
  plan: one(plans, { fields: [vouchers.planId], references: [plans.id] }),
  router: one(routers, { fields: [vouchers.routerId], references: [routers.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  plan: one(plans, { fields: [transactions.planId], references: [plans.id] }),
  router: one(routers, { fields: [transactions.routerId], references: [routers.id] }),
}));

// ── Storefront relations ──────────────────────────────────────────
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  user: one(user, { fields: [tenants.userId], references: [user.id] }),
  storePackages: many(storePackages),
  orders: many(orders),
  storeVouchers: many(storeVouchers),
  deliveryLogs: many(deliveryLogs),
  mikrotikConfigs: one(mikrotikConfigs),
  waConfigs: one(waConfigs),
}));

export const storePackagesRelations = relations(storePackages, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [storePackages.tenantId],
    references: [tenants.id],
  }),
  plan: one(plans, { fields: [storePackages.planId], references: [plans.id] }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  package: one(storePackages, {
    fields: [orders.packageId],
    references: [storePackages.id],
  }),
  storeVouchers: many(storeVouchers),
  deliveryLogs: many(deliveryLogs),
}));

export const storeVouchersRelations = relations(storeVouchers, ({ one }) => ({
  order: one(orders, { fields: [storeVouchers.orderId], references: [orders.id] }),
  tenant: one(tenants, {
    fields: [storeVouchers.tenantId],
    references: [tenants.id],
  }),
}));

export const deliveryLogsRelations = relations(deliveryLogs, ({ one }) => ({
  order: one(orders, { fields: [deliveryLogs.orderId], references: [orders.id] }),
  tenant: one(tenants, {
    fields: [deliveryLogs.tenantId],
    references: [tenants.id],
  }),
}));

export const mikrotikConfigsRelations = relations(mikrotikConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [mikrotikConfigs.tenantId],
    references: [tenants.id],
  }),
}));

export const waConfigsRelations = relations(waConfigs, ({ one }) => ({
  tenant: one(tenants, { fields: [waConfigs.tenantId], references: [tenants.id] }),
}));
