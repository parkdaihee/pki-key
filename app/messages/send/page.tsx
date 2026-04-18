'use client';

import { useEffect, useState } from 'react';
import forge from 'node-forge';
import { createDigitalEnvelope } from '@/lib/client-crypto';
import { getCertPem, getPrivateKeyPem } from '@/lib/storage';

export default function SendMessagePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => setUsers(data.users ?? []));
  }, []);

  async function sendEnvelope() {
    try {
      const senderPrivateKeyPem = getPrivateKeyPem();
      const senderCertPem = getCertPem();
      if (!senderPrivateKeyPem || !senderCertPem) throw new Error('송신자 키/인증서 없음');

      const target = users.find(u => u.id === receiverId);
      const receiverCertPem = target?.certificates?.[0]?.certPem;
      if (!receiverCertPem) throw new Error('수신자 인증서 없음');

      const senderCert = forge.pki.certificateFromPem(senderCertPem);
      const envelope = createDigitalEnvelope({
        senderPrivateKeyPem,
        receiverCertPem,
        senderCertPem,
        message
      });

      const res = await fetch('/api/message/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId,
          senderSerialNumber: senderCert.serialNumber,
          ...envelope
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '전송 실패');
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult((e as Error).message);
    }
  }

  return (
    <div className="card">
      <h1>전자봉투 전송</h1>
      <label>
        수신자
        <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)}>
          <option value="">선택</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email} {u.certificates?.length ? '(인증서 있음)' : '(인증서 없음)'}
            </option>
          ))}
        </select>
      </label>
      <label>
        메시지
        <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      <button onClick={sendEnvelope}>전자봉투 전송</button>
      <pre>{result}</pre>
    </div>
  );
}
