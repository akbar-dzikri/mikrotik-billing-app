import { RouterOSAPI, type IRosOptions } from 'node-routeros';
import tls from 'tls';
import { eq } from 'drizzle-orm';
import { decryptPassword } from '@/lib/crypto';
import { getCertFingerprint } from '@/lib/tls-fingerprint';
import { db } from '@/lib/db';
import { routers } from '@/db/schema/tables';

// Type alias for the RouterOS API connection
export type RosConnection = RouterOSAPI;

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

/**
 * Wraps RouterOSAPI instantiation to match the plan's createConnection pattern.
 */
async function createConnection(options: IRosOptions): Promise<RouterOSAPI> {
  const client = new RouterOSAPI(options);
  await client.connect();
  return client;
}

/**
 * Decrypts the router password and establishes a TLS connection to the
 * MikroTik RouterOS API.  Performs TLS fingerprint verification unless
 * the router has tlsVerified = true (Let's Encrypt / trusted CA).
 */
export async function getRouterClient(router: RouterRecord): Promise<RosConnection> {
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
    tls: router.tlsVerified ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
  });

  // TOFU fingerprint check — only when the router uses a self-signed cert
  if (!router.tlsVerified && router.tlsFingerprint) {
    const socket = (client as unknown as { connector: { socket: tls.TLSSocket } }).connector.socket;
    const fingerprint = getCertFingerprint(socket);
    if (fingerprint !== router.tlsFingerprint) {
      client.close();
      throw new Error('TLS fingerprint mismatch for router. Possible MITM attack.');
    }
  }

  return client;
}

// Connection pool — one persistent connection per router, recreated on failure
const clientPool = new Map<string, RosConnection>();

/**
 * Returns a cached connection for the given router ID, or creates a new one.
 * The pool key is the router database ID.
 */
export async function getOrCreateClient(routerId: string): Promise<RosConnection> {
  const cached = clientPool.get(routerId);
  if (cached && cached.connected) return cached;

  const [router] = await db.select().from(routers).where(eq(routers.id, routerId)).limit(1);
  if (!router) throw new Error(`Router ${routerId} not found`);

  const client = await getRouterClient(router);
  clientPool.set(routerId, client);
  return client;
}
