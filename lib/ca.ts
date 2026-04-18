import forge from 'node-forge';

const pki = forge.pki;

function normalizePemFromEnv(value: string) {
  return value.replace(/\\n/g, '\n');
}

export function getCaMaterials() {
  const certPem = process.env.CA_CERT_PEM;
  const privateKeyPem = process.env.CA_PRIVATE_KEY_PEM;

  if (!certPem || !privateKeyPem) {
    throw new Error('CA_CERT_PEM 또는 CA_PRIVATE_KEY_PEM 이 설정되지 않았습니다. 먼저 /api/ca-setup 로 생성하거나 .env에 넣으세요.');
  }

  return {
    caCertPem: normalizePemFromEnv(certPem),
    caPrivateKeyPem: normalizePemFromEnv(privateKeyPem)
  };
}

export function createSelfSignedCa() {
  const keys = pki.rsa.generateKeyPair({ bits: 2048, workers: 2 });
  const cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = String(Date.now());
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

  const attrs = [
    { name: 'commonName', value: 'Demo Root CA' },
    { name: 'countryName', value: 'KR' },
    { shortName: 'ST', value: 'Seoul' },
    { name: 'localityName', value: 'Seoul' },
    { name: 'organizationName', value: 'PKI Demo Service' },
    { shortName: 'OU', value: 'Root CA' }
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'keyUsage', keyCertSign: true, digitalSignature: true, cRLSign: true },
    { name: 'subjectKeyIdentifier' }
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    certPem: pki.certificateToPem(cert),
    privateKeyPem: pki.privateKeyToPem(keys.privateKey)
  };
}

export function issueUserCertificate(publicKeyPem: string, commonName: string) {
  const { caCertPem, caPrivateKeyPem } = getCaMaterials();
  const caCert = pki.certificateFromPem(caCertPem);
  const caPrivateKey = pki.privateKeyFromPem(caPrivateKeyPem);
  const userPublicKey = pki.publicKeyFromPem(publicKeyPem);

  const cert = pki.createCertificate();
  cert.publicKey = userPublicKey;
  cert.serialNumber = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  cert.setSubject([
    { name: 'commonName', value: commonName },
    { name: 'organizationName', value: 'PKI Demo Service' },
    { shortName: 'OU', value: 'Users' }
  ]);

  cert.setIssuer(caCert.subject.attributes);
  cert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
    { name: 'extKeyUsage', clientAuth: true, emailProtection: true },
    { name: 'subjectKeyIdentifier' },
    { name: 'authorityKeyIdentifier', keyIdentifier: true, authorityCertIssuer: true, serialNumber: caCert.serialNumber }
  ]);

  cert.sign(caPrivateKey, forge.md.sha256.create());

  return {
    certPem: pki.certificateToPem(cert),
    serialNumber: cert.serialNumber,
    issuedAt: cert.validity.notBefore,
    expiresAt: cert.validity.notAfter
  };
}

export function verifyCertWithCa(certPem: string) {
  const { caCertPem } = getCaMaterials();
  const caCert = pki.certificateFromPem(caCertPem);
  const cert = pki.certificateFromPem(certPem);
  return caCert.verify(cert);
}
