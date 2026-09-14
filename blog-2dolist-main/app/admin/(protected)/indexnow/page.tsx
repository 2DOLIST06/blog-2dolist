'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';
import type { IndexNowPage } from '@/lib/indexnow/core';

type ListResponse = { data: IndexNowPage[] };
type SubmitResponse = { data: { submittedUrls: string[] } };
type SortDirection = 'newest' | 'oldest';

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

const reasonLabels: Record<IndexNowPage['submissionReason'], string> = {
  'never-submitted': 'Jamais envoyée',
  modified: 'Modifiée depuis le dernier envoi',
  unchanged: 'Aucune modification détectée'
};

export default function IndexNowAdminPage() {
  const router = useRouter();
  const [pages, setPages] = useState<IndexNowPage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortDirection, setSortDirection] = useState<SortDirection>('newest');
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

  const loadPages = useCallback(async (preserveMessages = false) => {
    setLoading(true);
    if (!preserveMessages) { setError(''); setSuccess(''); }
    try {
      const payload = await adminApi.get<ListResponse>('/admin-api/indexnow');
      setPages(payload.data);
      setSelected(new Set(payload.data.filter((page) => page.needsSubmission).map((page) => page.url)));
    } catch (reason) {
      handleError(reason);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => { void loadPages(); }, [loadPages]);

  const sortedPages = useMemo(() => [...pages].sort((a, b) => {
    const aTime = a.lastModified ? Date.parse(a.lastModified) : 0;
    const bTime = b.lastModified ? Date.parse(b.lastModified) : 0;
    return sortDirection === 'newest' ? bTime - aTime : aTime - bTime;
  }), [pages, sortDirection]);
  const allSelected = pages.length > 0 && selected.size === pages.length;
  const partiallySelected = selected.size > 0 && !allSelected;
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = partiallySelected; }, [partiallySelected]);

  const submit = async (body: { urls: string[] } | { onlyNeeded: true }) => {
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const payload = await adminApi.post<SubmitResponse>('/admin-api/indexnow', body);
      const count = payload.data.submittedUrls.length;
      setSuccess(`${count} URL${count > 1 ? 's ont' : ' a'} été envoyée${count > 1 ? 's' : ''} avec succès.`);
      await loadPages(true);
    } catch (reason) {
      handleError(reason);
      await loadPages(true);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;
  const neededCount = pages.filter((page) => page.needsSubmission).length;

  return (
    <section className="max-w-7xl">
      <p className="text-xs uppercase tracking-wider text-brand-400">Référencement</p>
      <h1 className="mt-2 text-3xl font-bold text-white">Bing IndexNow</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-300">Soumettez à Bing les URL publiques du sitemap. Les pages nouvelles ou modifiées sont présélectionnées automatiquement.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-slate-900 px-3 py-2 text-sm">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
        <span className="rounded-lg bg-slate-900 px-3 py-2 text-sm">{neededCount} à envoyer</span>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || selected.size === 0} onClick={() => void submit({ urls: [...selected] })}>Envoyer la sélection</button>
        <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || neededCount === 0} onClick={() => void submit({ onlyNeeded: true })}>Envoyer automatiquement les nouvelles/mises à jour</button>
        <button className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={busy} onClick={() => void loadPages()}>Actualiser</button>
      </div>

      {loading && <p className="mt-5 text-sm text-slate-300" role="status">Chargement des URL…</p>}
      {submitting && <p className="mt-5 text-sm text-slate-300" role="status">Envoi à IndexNow en cours…</p>}
      {error && <p className="mt-5 rounded-lg border border-red-700 bg-red-950/50 p-3 text-sm text-red-200" role="alert">{error}</p>}
      {success && <p className="mt-5 rounded-lg border border-emerald-700 bg-emerald-950/50 p-3 text-sm text-emerald-200" role="status">{success}</p>}

      {!loading && <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-[960px] w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-200"><tr>
            <th className="p-3"><input ref={selectAllRef} type="checkbox" aria-label="Sélectionner toutes les URL" checked={allSelected} disabled={busy || pages.length === 0} onChange={(event) => setSelected(event.target.checked ? new Set(pages.map((page) => page.url)) : new Set())} /></th>
            <th className="p-3">URL</th>
            <th className="p-3"><button className="font-semibold underline decoration-dotted underline-offset-4" aria-label={`Trier par dernière modification, ordre ${sortDirection === 'newest' ? 'croissant' : 'décroissant'}`} onClick={() => setSortDirection((value) => value === 'newest' ? 'oldest' : 'newest')}>Dernière modification {sortDirection === 'newest' ? '↓' : '↑'}</button></th>
            <th className="p-3">Dernier envoi</th><th className="p-3">État</th>
          </tr></thead>
          <tbody>{sortedPages.map((page) => <tr className="border-t border-slate-800" key={page.url}>
            <td className="p-3"><input type="checkbox" aria-label={`Sélectionner ${page.url}`} checked={selected.has(page.url)} disabled={busy} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(page.url)) next.delete(page.url); else next.add(page.url); return next; })} /></td>
            <td className="max-w-md break-all p-3"><a href={page.url} target="_blank" rel="noopener noreferrer" className="text-brand-300 underline">{page.url}</a></td>
            <td className="whitespace-nowrap p-3">{formatDate(page.lastModified)}</td>
            <td className="whitespace-nowrap p-3">{formatDate(page.submittedAt)}</td>
            <td className="p-3"><span className={`inline-block rounded-full px-2.5 py-1 text-xs ${page.needsSubmission ? 'bg-amber-900 text-amber-100' : 'bg-emerald-900 text-emerald-100'}`}>{reasonLabels[page.submissionReason]}</span></td>
          </tr>)}</tbody>
        </table>
        {pages.length === 0 && <p className="p-6 text-center text-slate-400">Aucune URL indexable trouvée.</p>}
      </div>}
    </section>
  );
}
