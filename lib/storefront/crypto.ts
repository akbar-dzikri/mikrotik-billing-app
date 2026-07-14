import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

/**
 * Storefront crypto — intentionally SEPARATE from lib/crypto.ts.
 *
 *   lib/crypto.ts                            lib/storefront/crypto.ts
 *   ─────────────────────────────             ──────────────────────────────────
 *   ROUTER_ENCRYPTION_KEY                    STOREFRONT_ENCRYPTION_KEY
 *   Key: hex decode                          Key: SHA-256 hash of raw string
 *   IV: 16 bytes                             IV: 12 bytes
 *   Output: separate hex fields              Output: base64 joined with ":"
 *   Purpose: MikroTik API-SSL creds          Purpose: WA tokens, MT config passwords
 *
 * Different env var + different key derivation + different output format =
 * no accidental cross-contamination between credential domains.
 */

function getKey(): Buffer {
  const raw = process.env.STOREFRONT_ENCRYPTION_KEY;
  if (!raw) throw new Error("STOREFRONT_ENCRYPTION_KEY is not set");
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const [ivB64, tagB64, encB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !encB64) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([decipher.update(Buffer.from(encB64, "base64")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

export function generateVoucherCode(len = 6): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function generateUsername(): string {
  return `arn${randomBytes(3).toString("hex")}`;
}
