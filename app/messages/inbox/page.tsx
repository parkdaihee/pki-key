'use client';

import { useEffect, useState } from 'react';
import { openDigitalEnvelope } from '@/lib/client-crypto';
import { getPrivateKeyPem } from '@/lib/storage';

export default function InboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [opened, setOpened] = useState<any>(null);

  useEffect(() => {
    fetch('/api/message/inbox').then(r => r.json()).then(data => setItems(data.items ?? []));
  }, []);

  async function openMessage(id: string) {
    const res = await fetch(`/api/message/${id}`);
    const data = await res.json();
    setSelected(data);
    try {
      const receiverPrivateKeyPem = getPrivateKeyPem();
      if (!receiverPrivateKeyPem) throw new Error('브라우저에 수신자 개인키 없음');
      if (!data.senderCertPem) throw new Error('송신자 인증서 없음');

      const result = openDigitalEnvelope({
        receiverPrivateKeyPem,
        senderCertPem: data.senderCertPem,
        encryptedMessageHex: data.item.encryptedMessageHex,
        encryptedSessionKeyHex: data.item.encryptedSessionKeyHex,
        ivHex: data.item.ivHex
      });
      setOpened(result);
    } catch (e) {
      setOpened({ error: (e as Error).message });
    }
  }

  return (
    <div className="card">
      <h1>받은 메시지</h1>
      {items.map((item) => (
        <div className="card" key={item.id}>
          <p>보낸 사람: {item.sender?.email}</p>
          <p>시간: {item.createdAt}</p>
          <button onClick={() => openMessage(item.id)}>열기/검증</button>
        </div>
      ))}
      <h3>원본</h3>
      <pre>{JSON.stringify(selected, null, 2)}</pre>
      <h3>복호화/서명 검증 결과</h3>
      <pre>{JSON.stringify(opened, null, 2)}</pre>
    </div>
  );
}
