import { db } from '@/lib/db';
import { orders, storeVouchers, deliveryLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateUsername, generateVoucherCode } from './crypto';
import { sendWhatsApp, buildVoucherMessage } from './wa';
import { getMikrotikConfig, getWaConfig } from './queries';
import type { WaConfig } from './wa';
import { getDeviceHandler } from '@/lib/devices/resolver';
import { decryptSecret } from './crypto';
import { randomUUID } from 'node:crypto';

export async function createOrder(input: {
  tenantId: string;
  packageId: string;
  customerName: string;
  waNumber: string;
  amountIdr: number;
}) {
  const id = randomUUID();
  await db.insert(orders).values({
    id,
    tenantId: input.tenantId,
    packageId: input.packageId,
    customerName: input.customerName,
    waNumber: input.waNumber,
    amountIdr: input.amountIdr,
    status: 'pending',
  });
  return { orderId: id };
}

export async function simulatePayment(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      tenant: true,
      package: {
        with: { plan: true },
      },
    },
  });

  if (!order) throw new Error('Order tidak ditemukan');
  if (!order.tenant) throw new Error('Data tenant tidak lengkap');
  if (!order.package) throw new Error('Data paket tidak lengkap');
  if (order.package.plan && !order.package.plan.routerId) throw new Error('Paket tidak terkait dengan router');

  if (order.status === 'fulfilled' || order.status === 'paid') {
    return { orderId: order.id, alreadyProcessed: true };
  }

  // 1) Mark paid
  const paymentRef = `SIM-${Date.now()}`;
  await db
    .update(orders)
    .set({ status: 'paid', paidAt: new Date(), paymentRef })
    .where(eq(orders.id, order.id));

  // 2) Generate voucher
  const username = generateUsername();
  const password = generateVoucherCode(6);
  const profile = order.package.hotspotProfile;

  // 3) Try Mikrotik push (non-fatal) using native RouterOS API via device handler
  let mikrotikSynced: Date | null = null;
  let mikrotikError: string | null = null;

  try {
    const plan = order.package.plan;
    if (plan && plan.routerId) {
      const handler = getDeviceHandler(plan.type);
      await handler.addCustomer(
        {
          id: order.id,
          routerId: plan.routerId,
          username,
          password,
          planId: plan.id,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        plan as any,
      );
      mikrotikSynced = new Date();
    } else {
      const mtCfg = await getMikrotikConfig(order.tenantId);
      if (mtCfg) {
        // Fallback: use basic mikrotik config
        mikrotikError = 'Router plan tidak dikonfigurasi, voucher dibuat tanpa push Mikrotik';
      } else {
        mikrotikError = 'Router Mikrotik belum dikonfigurasi (mode demo)';
      }
    }
  } catch (err) {
    mikrotikError = err instanceof Error ? err.message : 'Gagal sinkron ke Mikrotik';
  }

  // 4) Save voucher
  const voucherId = randomUUID();
  await db.insert(storeVouchers).values({
    id: voucherId,
    orderId: order.id,
    tenantId: order.tenantId,
    username,
    password,
    hotspotProfile: profile ?? undefined,
    mikrotikSyncedAt: mikrotikSynced ?? undefined,
    mikrotikError,
  });

  // 5) Send WhatsApp (non-fatal)
  let anySent = false;
  try {
    const waCfg = await getWaConfig(order.tenantId);
    if (waCfg) {
      const message = buildVoucherMessage({
        brand: order.tenant.name,
        customer: order.customerName,
        packageName: order.package.name,
        duration: order.package.durationLabel,
        username,
        password,
        orderId: order.id,
      });

      const config: WaConfig = {
        cloudPhoneId: waCfg.cloudPhoneId,
        cloudToken: waCfg.cloudTokenEnc ? decryptSecret(waCfg.cloudTokenEnc) : null,
        cloudTemplateName: waCfg.cloudTemplateName,
        fonnteToken: waCfg.fonnteTokenEnc ? decryptSecret(waCfg.fonnteTokenEnc) : null,
        wablasToken: waCfg.wablasTokenEnc ? decryptSecret(waCfg.wablasTokenEnc) : null,
        wablasDomain: waCfg.wablasDomain,
        providerOrder: waCfg.providerOrder ?? ['wa_cloud', 'fonnte', 'wablas'],
      };

      const attempts = await sendWhatsApp(config, order.waNumber, message);
      for (const a of attempts) {
        await db.insert(deliveryLogs).values({
          id: randomUUID(),
          orderId: order.id,
          tenantId: order.tenantId,
          provider: a.provider,
          status: a.ok ? 'sent' : 'failed',
          response: a.response,
        });
        if (a.ok) anySent = true;
      }
    }
  } catch {
    // WhatsApp failure is non-fatal
  }

  // 6) Mark fulfilled
  await db
    .update(orders)
    .set({ status: 'fulfilled', fulfilledAt: new Date() })
    .where(eq(orders.id, order.id));

  return {
    orderId: order.id,
    whatsappSent: anySent,
    mikrotikSynced: !!mikrotikSynced,
    mikrotikError,
  };
}
