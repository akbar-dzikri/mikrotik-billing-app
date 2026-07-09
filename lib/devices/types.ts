import type { InferSelectModel } from "drizzle-orm";
import { customers, plans, pools } from "@/db/schema/tables";

export type Customer = InferSelectModel<typeof customers>;
export type Plan = InferSelectModel<typeof plans>;
export type Pool = InferSelectModel<typeof pools>;

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
