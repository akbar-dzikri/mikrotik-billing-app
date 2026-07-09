import { relations } from 'drizzle-orm';
import { routers, plans, pools, customers, userRecharges, vouchers, transactions } from './tables';

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
