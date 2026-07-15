import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

const TENANT_SLUG = 'e2e-tenant';
const TENANT_NAME = 'E2E Tenant';
const PACKAGE_ID = '11111111-1111-1111-1111-111111111111';
const PACKAGE_NAME = 'Paket 1 Hari';
const PACKAGE_PRICE = 10000;
const PACKAGE_DURATION = '1 Hari';
const ANCHOR_USER_EMAIL = 'test@example.com';

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[seed-e2e] DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  // tenants.userId is NOT NULL and references user.id, so ensure an admin
  // user exists first. Reuse the super-admin seed email as the anchor owner.
  const anchorUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.email, ANCHOR_USER_EMAIL),
    columns: { id: true },
  });

  let ownerId: string;
  if (anchorUser) {
    ownerId = anchorUser.id;
  } else {
    ownerId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: ownerId,
      email: ANCHOR_USER_EMAIL,
      name: 'E2E Owner',
      role: 'super_admin',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[seed-e2e] created anchor user ${ANCHOR_USER_EMAIL} (id: ${ownerId})`);
  }

  const existingTenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, TENANT_SLUG),
    columns: { id: true, name: true, isActive: true },
  });

  let tenantId: string;
  if (existingTenant) {
    tenantId = existingTenant.id;
    await db
      .update(schema.tenants)
      .set({ name: TENANT_NAME, isActive: true, userId: ownerId, updatedAt: new Date() })
      .where(eq(schema.tenants.id, tenantId));
    console.log(`[seed-e2e] updated tenant ${TENANT_SLUG} (id: ${tenantId})`);
  } else {
    tenantId = crypto.randomUUID();
    await db.insert(schema.tenants).values({
      id: tenantId,
      userId: ownerId,
      slug: TENANT_SLUG,
      name: TENANT_NAME,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[seed-e2e] created tenant ${TENANT_SLUG} (id: ${tenantId})`);
  }

  const existingPackage = await db.query.storePackages.findFirst({
    where: (p, { eq }) => eq(p.id, PACKAGE_ID),
    columns: { id: true, name: true },
  });

  if (existingPackage) {
    await db
      .update(schema.storePackages)
      .set({
        tenantId,
        name: PACKAGE_NAME,
        priceIdr: PACKAGE_PRICE,
        durationLabel: PACKAGE_DURATION,
        isActive: true,
        sortOrder: 1,
      })
      .where(eq(schema.storePackages.id, PACKAGE_ID));
    console.log(`[seed-e2e] updated package ${PACKAGE_NAME} (id: ${PACKAGE_ID})`);
  } else {
    await db.insert(schema.storePackages).values({
      id: PACKAGE_ID,
      tenantId,
      name: PACKAGE_NAME,
      priceIdr: PACKAGE_PRICE,
      durationLabel: PACKAGE_DURATION,
      isActive: true,
      sortOrder: 1,
      createdAt: new Date(),
    });
    console.log(`[seed-e2e] created package ${PACKAGE_NAME} (id: ${PACKAGE_ID})`);
  }

  await pool.end();
}

seed().catch((err) => {
  console.error('[seed-e2e] failed:', err);
  process.exit(1);
});
