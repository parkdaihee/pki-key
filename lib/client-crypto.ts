'use client';

import forge from 'node-forge';

const pki = forge.pki;

export function generateClientKeyPair() {
  const keys = pki.rsa.generateKeyPair({ bits: 2048, workers: -1 });
  return {
    publicKeyPem: pki.publicKeyToPem(keys.publicKey),
    privateKeyPem: pki.privateKeyToPem(keys.privateKey)
  };
}

export function signText(privateKeyPem: string, text: string) {
  const privateKey = pki.privateKeyFromPem(privateKeyPem);
  const md = forge.md.sha256.create();
  md.update(text, 'utf8');
  return forge.util.encode64(privateKey.sign(md));
}

export function createDigitalEnvelope({
  senderPrivateKeyPem,
  receiverCertPem,
  senderCertPem,
  message
}: {
  senderPrivateKeyPem: string;
  receiverCertPem: string;
  senderCertPem: string;
  message: string;
}) {
  const senderPrivateKey = pki.privateKeyFromPem(senderPrivateKeyPem);
  const receiverCert = pki.certificateFromPem(receiverCertPem);
  const receiverPublicKey = receiverCert.publicKey;
  const senderCert = pki.certificateFromPem(senderCertPem);

  const md = forge.md.sha256.create();
  md.update(message, 'utf8');
  const signatureBase64 = forge.util.encode64(senderPrivateKey.sign(md));

  const payload = JSON.stringify({
    message,
    signatureBase64,
    senderSerialNumber: senderCert.serialNumber
  });

  const sessionKey = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(16);
  const cipher = forge.cipher.createCipher('AES-CBC', sessionKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(payload, 'utf8'));
  cipher.finish();

  const encryptedSessionKey = receiverPublicKey.encrypt(sessionKey, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() }
  });

  return {
    encryptedMessageHex: cipher.output.toHex(),
    encryptedSessionKeyHex: forge.util.bytesToHex(encryptedSessionKey),
    ivHex: forge.util.bytesToHex(iv)
  };
}

export function openDigitalEnvelope({
  receiverPrivateKeyPem,
  senderCertPem,
  encryptedMessageHex,
  encryptedSessionKeyHex,
  ivHex
}: {
  receiverPrivateKeyPem: string;
  senderCertPem: string;
  encryptedMessageHex: string;
  encryptedSessionKeyHex: string;
  ivHex: string;
}) {
  const receiverPrivateKey = pki.privateKeyFromPem(receiverPrivateKeyPem);
  const senderCert = pki.certificateFromPem(senderCertPem);

  const sessionKey = receiverPrivateKey.decrypt(forge.util.hexToBytes(encryptedSessionKeyHex), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() }
  });

  const decipher = forge.cipher.createDecipher('AES-CBC', sessionKey);
  decipher.start({ iv: forge.util.hexToBytes(ivHex) });
  decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedMessageHex)));
  const ok = decipher.finish();
  if (!ok) throw new Error('복호화 실패');

  const payload = JSON.parse(decipher.output.toString());
  const md = forge.md.sha256.create();
  md.update(payload.message, 'utf8');
  const verified = senderCert.publicKey.verify(md.digest().bytes(), forge.util.decode64(payload.signatureBase64));

  return {
    ...payload,
    verified
  };
}
