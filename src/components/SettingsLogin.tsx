'use client';

import { FormEvent, useState } from 'react';

export default function SettingsLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch('/api/settings/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      window.location.assign('/settings');
      return;
    }
    const body = await response.json().catch(() => ({}));
    setError(body.error ?? 'ログインに失敗しました');
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm text-ink-secondary">
        管理パスワード
        <input
          autoFocus
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink outline-none focus:border-accent"
        />
      </label>
      {error && <p className="text-sm text-status-bad">{error}</p>}
      <button
        disabled={busy}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? '確認中…' : '設定を開く'}
      </button>
    </form>
  );
}
