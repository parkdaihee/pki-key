'use client';

export const storageKeys = {
  privateKey: 'pki_private_key_pem',
  certPem: 'pki_cert_pem'
};

export function savePrivateKeyPem(privateKeyPem: string) {
  localStorage.setItem(storageKeys.privateKey, privateKeyPem);
}

export function getPrivateKeyPem() {
  return localStorage.getItem(storageKeys.privateKey);
}

export function saveCertPem(certPem: string) {
  localStorage.setItem(storageKeys.certPem, certPem);
}

export function getCertPem() {
  return localStorage.getItem(storageKeys.certPem);
}
