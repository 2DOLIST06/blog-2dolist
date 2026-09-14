'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';
import type { IndexNowBatchResult } from '@/lib/indexnow/core';

type ListResponse = { data: string[] };
type SubmitResponse = { data: { submittedUrls: string[]; batches: IndexNowBatchResult[] } };

export default function IndexNowAdminPage() {
  const router = useRouter();
  const [urls, setUrls] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const selectAllRef = useRef<HTMLInputElement>(null);

  const handleError = useCallback((reason: unknown) => {
    if (reason instanceof AdminApiError && reason.status === 401) {
      router.replace('/admin/login?next=/admin/indexnow');
      return;
    }
    const apiDetails = reason instanceof AdminApiError && reason.details && typeof reason.details === 'object'
      ? (reason.details as { error?: unknown }).error
      : undefined;
    setError(typeof apiDetails === 'string' ? apiDetails : reason instanceof Error ? reason.message : 'Une erreur inattendue est survenue.');
  }, [router]);

  const loadUrls = useCallback(async (preserveMessages = false) => {
    setLoading(true);
    if (!preserveMessages) { setError(''); setSuccess(''); }
    try {
      const payload = await adminApi.get<ListResponse>('/admin-api/indexnow');
      setUrls(payload.data);
      setSelected((current) => new Set(payload.data.filter((url) => current.has(url))));
    } catch (reason) {
      handleError(reason);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => { void loadUrls(); }, [loadUrls]);

  const allSelected = urls.length > 0 && selected.size === urls.length;
  const partiallySelected = selected.size > 0 && !allSelected;
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  const submit = async () => {
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const payload = await adminApi.post<SubmitResponse>('/admin-api/indexnow', { urls: [...selected] });
      const count = payload.data.submittedUrls.length;
      const batchCount = payload.data.batches.length;
      setSuccess(`${count} URL${count > 1 ? 's ont' : ' a'} été envoyée${count > 1 ? 's' : ''} avec succès en ${batchCount} lot${batchCount > 1 ? 's' : ''}.`);
    } catch (reason) {
      handleError(reason);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <section className="max-w-7xl">
      <p className="text-xs uppercase tracking-wider text-brand-400">Référencement</p>
      <h1 className="mt-2 text-3xl font-bold text-white">Bing IndexNow</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-300">Sélectionnez et envoyez manuellement à IndexNow les URL publiques présentes dans le sitemap.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-slate-900 px-3 py-2 text-sm">{urls.length} URL{urls.length > 1 ? 's' : ''} au total</span>
        <span className="rounded-lg bg-slate-900 px-3 py-2 text-sm">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || selected.size === 0} onClick={() => void submit()}>Envoyer la sélection</button>
        <button className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={busy} onClick={() => void loadUrls()}>Actualiser</button>
        <button className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || urls.length === 0} onClick={() => setSelected(allSelected ? new Set() : new Set(urls))}>{allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}</button>
      </div>

      {loading && <p className="mt-5 text-sm text-slate-300" role="status">Chargement des URL…</p>}
      {submitting && <p className="mt-5 text-sm text-slate-300" role="status">Envoi à IndexNow en cours…</p>}
      {error && <p className="mt-5 rounded-lg border border-red-700 bg-red-950/50 p-3 text-sm text-red-200" role="alert">{error}</p>}
      {success && <p className="mt-5 rounded-lg border border-emerald-700 bg-emerald-950/50 p-3 text-sm text-emerald-200" role="status">{success}</p>}

      {!loading && <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-900 text-slate-200"><tr>
            <th className="w-12 p-3"><input ref={selectAllRef} type="checkbox" aria-label="Sélectionner toutes les URL" checked={allSelected} disabled={busy || urls.length === 0} onChange={(event) => setSelected(event.target.checked ? new Set(urls) : new Set())} /></th>
            <th className="p-3">URL</th>
          </tr></thead>
          <tbody>{urls.map((url) => <tr className="border-t border-slate-800" key={url}>
            <td className="p-3"><input type="checkbox" aria-label={`Sélectionner ${url}`} checked={selected.has(url)} disabled={busy} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(url)) next.delete(url); else next.add(url); return next; })} /></td>
            <td className="break-all p-3"><a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-300 underline">{url}</a></td>
          </tr>)}</tbody>
        </table>
        {urls.length === 0 && <p className="p-6 text-center text-slate-400">Aucune URL indexable trouvée.</p>}
      </div>}
    </section>
  );
}
