import { getOrCreateClient, RosConnection } from "@/lib/mikrotik-client";
import type { DeviceHandler, OnlineStatus, Customer, Plan, Pool } from "./types";

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
