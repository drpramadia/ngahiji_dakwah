'use client';

import { useState, useTransition } from 'react';
import { runExpireOrdersAction } from './expire-action';

export default function ExpireOrdersButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function run() {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      try {
        const res = await runExpireOrdersAction();
        const parts = [`${res.pendingExpired} pending expired`, `${res.waitingExpired} waiting expired`];
        if (res.errors.length) parts.push(`${res.errors.length} error(s): ${res.errors.join('; ')}`);
        setMsg(parts.join(' · '));
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Gagal expire orders');
      }
    });
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button type="button" className="btn light" onClick={run} disabled={pending}>
        {pending ? 'Menjalankan...' : 'Expire stale orders (manual run)'}
      </button>
      {msg && <p className="admin-status" style={{ margin: 0 }}>{msg}</p>}
      {err && <p className="admin-error" style={{ margin: 0 }}>{err}</p>}
    </div>
  );
}
