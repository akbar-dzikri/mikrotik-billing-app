import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['super_admin', 'admin']);
export const routerStatusEnum = pgEnum('router_status', ['online', 'offline', 'unknown']);
export const planTypeEnum = pgEnum('plan_type', ['hotspot', 'pppoe']);
export const customerStatusEnum = pgEnum('customer_status', ['active', 'expired', 'disabled']);
export const transactionTypeEnum = pgEnum('transaction_type', ['recharge', 'voucher', 'refund']);
