'use client';

import { useState } from 'react';
import { signText } from '@/lib/client-crypto';
import { getCertPem, getPrivateKeyPem } from '@/lib/storage';

export default function SignLoginPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');

  async function doSignLogin() {
    try {
      const privateKeyPem = getPrivateKeyPem();
      const certPem = getCertPem();
      if (!privateKeyPem || !certPem) throw new Error('브라우저에 개인키/인증서가 없습니다. 먼저 인증서를 발급하세요.');

      const challengeRes = await fetch('/api/sign-login/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const challengeData = await challengeRes.json();
      if (!challengeRes.ok) throw new Error(challengeData.error || 'challenge 실패');

      const signatureBase64 = signText(privateKeyPem, challengeData.nonce);

      const verifyRes = await fetch('/api/sign-login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challengeData.challengeId,
          signatureBase64,
          certPem
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || '검증 실패');
      setResult(JSON.stringify(verifyData, null, 2));
    } catch (e) {
      setResult((e as Error).message);
    }
  }

  return (
    <div className="card">
      <h1>전자서명 로그인</h1>
      <label>
        이메일
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="social login에 사용한 이메일" />
      </label>
      <button onClick={doSignLogin}>challenge 서명 후 검증</button>
      <pre>{result}</pre>
    </div>
  );
}
