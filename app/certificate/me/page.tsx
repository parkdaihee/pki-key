'use client';

import { useEffect, useState } from 'react';
import { getCertPem } from '@/lib/storage';

export default function MyCertificatePage() {
  const [serverData, setServerData] = useState<any>(null);
  const [clientCert, setClientCert] = useState('');

  useEffect(() => {
    setClientCert(getCertPem() ?? '');
    fetch('/api/cert/me').then(r => r.json()).then(setServerData);
  }, []);

  async function revoke() {
    const res = await fetch('/api/cert/revoke', { method: 'POST' });
    const data = await res.json();
    setServerData({ cert: data.cert });
  }

  return (
    <div className="card">
      <h1>내 인증서</h1>
      <p>DB 저장본과 브라우저 저장본을 같이 확인하는 페이지</p>
      <h3>서버 DB 정보</h3>
      <pre>{JSON.stringify(serverData, null, 2)}</pre>
      <button onClick={revoke}>현재 인증서 폐지</button>
      <h3>브라우저 localStorage 인증서 PEM</h3>
      <pre>{clientCert || '없음'}</pre>
    </div>
  );
}
