import { db } from '@/lib/db';
import { tenants, storePackages, orders, mikrotikConfigs, waConfigs } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function getTenantWithPackages(slug: string) {
  const tenant = await db.query.tenants.findFirst({
    where: and(eq(tenants.slug, slug), eq(tenants.isActive, true)),
    columns: { id: true, slug: true, name: true, tagline: true, brandColor: true, waSupport: true },
  });
  if (!tenant) return null;
  const packages = await db.query.storePackages.findMany({
    where: and(eq(storePackages.tenantId, tenant.id), eq(storePackages.isActive, true)),
    orderBy: [asc(storePackages.sortOrder)],
    columns: { id: true, name: true, description: true, priceIdr: true, durationLabel: true, sortOrder: true },
  });
  return { tenant, packages };
}

export async function getOrderDetails(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      tenant: { columns: { id: true, slug: true, name: true, brandColor: true, waSupport: true } },
      package: { columns: { id: true, name: true, durationLabel: true, hotspotProfile: true } },
      storeVouchers: { columns: { id: true, username: true, password: true, hotspotProfile: true, mikrotikSyncedAt: true, mikrotikError: true } },
    },
  });
}

export async function getTenantById(tenantId: string) {
  return db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
}

export async function getStorePackage(packageId: string, tenantId: string) {
  const pkg = await db.query.storePackages.findFirst({
    where: and(eq(storePackages.id, packageId), eq(storePackages.tenantId, tenantId), eq(storePackages.isActive, true)),
  });
  if (!pkg) return null;
  return pkg;
}

export async function getMikrotikConfig(tenantId: string) {
  return db.query.mikrotikConfigs.findFirst({
    where: and(eq(mikrotikConfigs.tenantId, tenantId), eq(mikrotikConfigs.isActive, true)),
  });
}

export async function getWaConfig(tenantId: string) {
  return db.query.waConfigs.findFirst({
    where: eq(waConfigs.tenantId, tenantId),
  });
}

export async function getTenantByToken(token: string) {
  // tokens are stored in mikrotik_configs.router_token field — but we don't have that yet.
  // For now, just look up by the config ID being the token.
  const cfg = await db.query.mikrotikConfigs.findFirst({
    where: and(eq(mikrotikConfigs.id, token), eq(mikrotikConfigs.isActive, true)),
    with: { tenant: true },
  });
  if (!cfg || !cfg.tenant) return null;
  const packages = await db.query.storePackages.findMany({
    where: and(eq(storePackages.tenantId, cfg.tenantId), eq(storePackages.isActive, true)),
    orderBy: [asc(storePackages.sortOrder)],
  });
  return {
    tenant: {
      id: cfg.tenant.id,
      slug: cfg.tenant.slug,
      name: cfg.tenant.name,
      tagline: cfg.tenant.tagline,
      brandColor: cfg.tenant.brandColor,
      waSupport: cfg.tenant.waSupport,
    },
    enabled: cfg.isActive,
    packages,
  };
}
