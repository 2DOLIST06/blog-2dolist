'use client';

import { useEffect, useRef, useState } from 'react';
import type { InternalLinkCategoryOption, InternalLinkDestination, InternalLinkType } from '@/types/internal-links';

type PickerType = InternalLinkType | 'all';
const fieldClass = 'rounded border border-slate-600 bg-white p-2 text-sm text-slate-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

export function InternalLinkPicker({ categories, onClose, onSelect }: {
  categories: InternalLinkCategoryOption[];
  onClose: () => void;
  onSelect: (destination: InternalLinkDestination) => void;
}) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<PickerType>('all');
  const [categoryId, setCategoryId] = useState('');
  const [items, setItems] = useState<InternalLinkDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [onClose]);
  useEffect(() => { setPage(1); }, [query, type, categoryId]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError('');
      const params = new URLSearchParams({ q: query, type, locale: 'fr', page: String(page), limit: '20' });
      if (type === 'post' && categoryId) params.set('categoryId', categoryId);
      try {
        const response = await fetch(`/admin-api/internal-links?${params}`, { cache: 'no-store', signal: controller.signal });
        const payload = await response.json().catch(() => ({})) as { data?: InternalLinkDestination[]; error?: string; pagination?: { totalPages?: number } };
        if (!response.ok) throw new Error(response.status === 401 ? 'Session expirée. Reconnectez-vous.' : payload.error || 'Recherche impossible.');
        setItems(payload.data ?? []); setTotalPages(Math.max(1, payload.pagination?.totalPages ?? 1));
      } catch (caught) {
        if ((caught as Error).name !== 'AbortError') { setItems([]); setError(caught instanceof Error ? caught.message : 'Recherche impossible.'); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, type, categoryId, page]);

  return (
    <div className="border-b border-slate-700 bg-slate-900 p-4" role="dialog" aria-modal="true" aria-label="Choisir un lien interne">
      <div className="flex items-center justify-between"><h3 className="font-semibold text-white">Lien interne</h3><button type="button" className="text-sm text-slate-300 hover:text-white" onClick={onClose}>Fermer</button></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input ref={inputRef} className={fieldClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher titre, slug ou URL…" aria-label="Rechercher une destination" />
        <select className={fieldClass} value={type} onChange={(event) => { const next = event.target.value as PickerType; setType(next); if (next !== 'post') setCategoryId(''); }} aria-label="Type de destination">
          <option value="all">Tous</option><option value="post">Articles</option><option value="category">Catégories</option><option value="static-page">Pages</option>
        </select>
        {type === 'post' ? <select className={fieldClass} value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="Catégorie des articles"><option value="">Toutes les catégories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select> : null}
      </div>
      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {loading ? <p className="text-sm text-slate-300">Recherche…</p> : error ? <p className="text-sm text-red-300" role="alert">{error}</p> : items.length === 0 ? <p className="text-sm text-slate-400">Aucun résultat.</p> : items.map((item) => (
          <button key={`${item.type}:${item.id}`} type="button" className="block w-full rounded border border-slate-700 bg-slate-950 p-3 text-left hover:border-brand-500" onClick={() => onSelect(item)}>
            <span className="flex justify-between gap-2 text-sm font-semibold text-white"><span>{item.title}</span><span className="text-xs uppercase text-brand-300">{item.type === 'post' ? 'Article' : item.type === 'category' ? 'Catégorie' : 'Page'} · FR</span></span>
            {item.category ? <span className="mt-1 block text-xs text-slate-400">{item.category.title}</span> : null}<span className="mt-1 block truncate text-xs text-slate-300">{item.href}</span>
          </button>
        ))}
      </div>
      {totalPages > 1 ? <div className="mt-3 flex items-center justify-end gap-3 text-xs text-slate-300"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="disabled:opacity-40">Précédent</button><span>{page}/{totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="disabled:opacity-40">Suivant</button></div> : null}
    </div>
  );
}
