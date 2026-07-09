import tls from 'tls';
import crypto from 'crypto';

export function getCertFingerprint(socket: tls.TLSSocket): string {
  const cert = socket.getPeerCertificate(true);
  if (!cert || !cert.raw) throw new Error('No peer certificate presented');
  return crypto.createHash('sha256').update(cert.raw).digest('hex');
}
