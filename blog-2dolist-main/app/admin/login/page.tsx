'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const nextPath = useMemo(() => {
    if (typeof window === 'undefined') return '/admin/posts';
    return new URLSearchParams(window.location.search).get('next') || '/admin/posts';
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/admin-api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
      setError(payload.message ?? payload.error ?? 'Login impossible. Vérifiez vos identifiants.');
      setLoading(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return <main className="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h1 className="text-2xl font-bold text-slate-900">Connexion admin</h1>
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <input className="w-full rounded border px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
      <input className="w-full rounded border px-3 py-2" type="password" placeholder="Mot de passe" value={password} onChange={(e)=>setPassword(e.target.value)} required />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button disabled={loading} className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60">{loading ? 'Connexion...' : 'Se connecter'}</button>
    </form>
  </main>;
}
