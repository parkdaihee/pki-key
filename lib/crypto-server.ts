import crypto from 'crypto';
import forge from 'node-forge';

export function randomNonce(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function verifySignature({ message, signatureBase64, certPem }: { message: string; signatureBase64: string; certPem: string; }) {
  const cert = forge.pki.certificateFromPem(certPem);
  const md = forge.md.sha256.create();
  md.update(message, 'utf8');
  return cert.publicKey.verify(md.digest().bytes(), forge.util.decode64(signatureBase64));
}
