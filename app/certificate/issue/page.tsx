'use client';

import { useState } from 'react';
import { generateClientKeyPair } from '@/lib/client-crypto';
import { saveCertPem, savePrivateKeyPem } from '@/lib/storage';

export default function CertificateIssuePage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function issueCert() {
    setLoading(true);
    setResult('키쌍 생성 중...');
    try {
      const { publicKeyPem, privateKeyPem } = generateClientKeyPair();
      savePrivateKeyPem(privateKeyPem);

      const res = await fetch('/api/cert/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKeyPem })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '발급 실패');

      saveCertPem(data.certPem);
      setResult(`발급 성공\nSerial: ${data.serialNumber}\n\n${data.certPem}`);
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>인증서 발급</h1>
      <p>브라우저에서 키쌍을 생성하고, 공개키를 서버로 보내 인증서를 발급받는다.</p>
      <button disabled={loading} onClick={issueCert}>{loading ? '처리 중...' : '인증서 발급'}</button>
      <pre>{result}</pre>
    </div>
  );
}
