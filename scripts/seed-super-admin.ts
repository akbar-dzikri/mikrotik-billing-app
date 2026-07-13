import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import * as schema from '../db/schema';

const SUPER_ADMIN = {
  email: process.env.SUPERADMIN_DEFAULT_EMAIL || 'test@example.com',
  password: process.env.SUPERADMIN_DEFAULT_PASSWORD || '12345678',
  name: 'Super Admin',
};

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  const existingUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.email, SUPER_ADMIN.email),
    columns: { id: true },
  });

  if (existingUser) {
    await db
      .update(schema.user)
      .set({ role: 'super_admin' })
      .where(eq(schema.user.id, existingUser.id));
    console.log(`User already exists — role set to super_admin (id: ${existingUser.id})`);
  } else {
    const id = crypto.randomUUID();
    const now = new Date();
    const hashedPassword = await hashPassword(SUPER_ADMIN.password);

    await db.insert(schema.user).values({
      id,
      email: SUPER_ADMIN.email,
      name: SUPER_ADMIN.name,
      role: 'super_admin',
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      userId: id,
      accountId: id,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`Super admin created: ${SUPER_ADMIN.email} (id: ${id})`);
  }

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
