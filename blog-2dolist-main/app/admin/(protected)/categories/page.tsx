'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';

type CategoryRow = { id: string; name?: string | null; title?: string | null; slug?: string | null; path?: string | null; articleCount?: number | null; postsCount?: number | null; _count?: { posts?: number }; isActive?: boolean | null; isIndexable?: boolean | null };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const extractRows = (payload: unknown): CategoryRow[] => {
  if (Array.isArray(payload)) return payload as CategoryRow[];
  if (!isRecord(payload)) return [];
  for (const key of ['data', 'categories', 'items', 'docs']) {
    const value = payload[key];
    if (Array.isArray(value)) return value as CategoryRow[];
    if (isRecord(value)) for (const nested of ['data', 'categories', 'items', 'docs']) if (Array.isArray(value[nested])) return value[nested] as CategoryRow[];
  }
  return [];
};
const yesNo = (value?: boolean | null) => value === true ? 'Oui' : value === false ? 'Non' : '—';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; adminApi.get('/admin-api/categories').then((payload) => { if (active) setRows(extractRows(payload)); }).catch((reason: unknown) => { if (!active) return; if (reason instanceof AdminApiError && reason.status === 401) return router.replace('/admin/login?next=/admin/categories'); setError(reason instanceof Error ? reason.message : 'Impossible de charger les catégories.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [router]);
  return <section>
    <h1 className="text-3xl font-bold">Catégories / rubriques</h1>
    <p className="mt-2 text-slate-300">Les chemins publics existants sont conservés sans modification.</p>
    {loading ? <p className="mt-6">Chargement…</p> : null}
    {error ? <p className="mt-6 rounded border border-red-700 bg-red-950/40 p-3 text-red-200">{error}</p> : null}
    {!loading && !error && !rows.length ? <p className="mt-6">Aucune catégorie retournée par l’API.</p> : null}
    {rows.length ? <div className="mt-6 overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-700"><th className="p-3">name</th><th className="p-3">slug</th><th className="p-3">path</th><th className="p-3">articles</th><th className="p-3">active</th><th className="p-3">indexable</th><th className="p-3">action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-slate-800"><td className="p-3">{row.name || row.title || '—'}</td><td className="p-3">{row.slug || '—'}</td><td className="p-3 font-mono text-xs">{row.path || '—'}</td><td className="p-3">{row.articleCount ?? row.postsCount ?? row._count?.posts ?? '—'}</td><td className="p-3">{yesNo(row.isActive)}</td><td className="p-3">{yesNo(row.isIndexable)}</td><td className="p-3"><Link className="font-medium underline" href={`/admin/categories/${row.id}`}>Modifier</Link></td></tr>)}</tbody></table></div> : null}
  </section>;
}
