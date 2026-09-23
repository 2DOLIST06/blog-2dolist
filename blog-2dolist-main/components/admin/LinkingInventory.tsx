'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import type { InternalLinkType, LinkingPage, LinkingRelation } from '@/types/internal-links';

type FilterType = InternalLinkType | 'all';
type SearchScope = 'title' | 'content';
type Sort = 'title' | 'incoming-asc' | 'incoming-desc' | 'outgoing-asc' | 'outgoing-desc';
const field = 'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500';
const labels: Record<InternalLinkType, string> = { post: 'Article', category: 'Catégorie', 'static-page': 'Page' };

const RelationList = ({ title, relations, direction }: { title: string; relations: LinkingRelation[]; direction: 'incoming' | 'outgoing' }) => (
  <section>
    <h3 className="font-semibold text-white">{title} <span className="text-slate-400">({relations.reduce((sum, relation) => sum + relation.occurrences, 0)})</span></h3>
    {relations.length ? <ul className="mt-2 space-y-2">{relations.map((relation, index) => (
      <li key={`${relation.sourceId}:${relation.destinationUrl}:${relation.anchor}:${index}`} className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm">
        <p><strong className="text-white">« {relation.anchor} »</strong>{relation.occurrences > 1 ? <span className="ml-2 rounded bg-brand-800 px-1.5 py-0.5 text-xs">×{relation.occurrences}</span> : null}</p>
        <p className="mt-1 text-slate-300">{direction === 'incoming' ? `Depuis : ${relation.sourceTitle}` : `Vers : ${relation.destinationTitle ?? 'Page du site principal'}`}</p>
        <p className="break-all text-xs text-slate-500">href réel : {relation.href}</p>
        <p className="break-all text-xs text-slate-400">{direction === 'incoming' ? relation.sourceUrl : relation.destinationUrl} · FR · {direction === 'outgoing' && !relation.destinationType ? 'Site principal' : labels[(direction === 'incoming' ? relation.sourceType : relation.destinationType) ?? 'static-page']}</p>
      </li>
    ))}</ul> : <p className="mt-2 text-sm text-slate-500">Aucun lien.</p>}
  </section>
);

export function LinkingInventory() {
  const [pages, setPages] = useState<LinkingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('title');
  const [contentMatches, setContentMatches] = useState<{ query: string; ids: Set<string> } | null>(null);
  const [contentSearchLoading, setContentSearchLoading] = useState(false);
  const [type, setType] = useState<FilterType>('all');
  const [category, setCategory] = useState('');
  const [orphansOnly, setOrphansOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('incoming-asc');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/admin-api/linking-inventory', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({})) as { data?: LinkingPage[]; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Analyse impossible.');
      setPages(payload.data ?? []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Analyse impossible.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => { setPage(1); }, [query, searchScope, contentMatches, type, category, orphansOnly, sort]);

  const searchAllContent = async () => {
    const needle = query.trim();
    if (!needle) { setContentMatches(null); return; }
    setContentSearchLoading(true); setError('');
    try {
      const response = await fetch(`/admin-api/linking-inventory?contentQuery=${encodeURIComponent(needle)}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({})) as { matchingIds?: string[]; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Recherche impossible.');
      setContentMatches({ query: needle, ids: new Set(payload.matchingIds ?? []) });
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Recherche impossible.'); }
    finally { setContentSearchLoading(false); }
  };

  const categories = useMemo(() => Array.from(new Map(pages.flatMap((item) => item.category ? [[item.category.id, item.category.title] as const] : [])).entries()), [pages]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr');
    return pages.filter((item) => (type === 'all' || item.type === type)
      && (!category || item.category?.id === category)
      && (!orphansOnly || item.incomingCount === 0)
      && (!needle || (searchScope === 'title'
        ? item.title.toLocaleLowerCase('fr').includes(needle)
        : contentMatches === null || contentMatches.query !== query.trim() || contentMatches.ids.has(item.id))))
      .sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title, 'fr')
        : sort === 'incoming-asc' ? a.incomingCount - b.incomingCount
        : sort === 'incoming-desc' ? b.incomingCount - a.incomingCount
        : sort === 'outgoing-asc' ? a.outgoingCount - b.outgoingCount
        : b.outgoingCount - a.outgoingCount);
  }, [pages, query, searchScope, contentMatches, type, category, orphansOnly, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  return <div>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold text-white">Maillage interne</h1><p className="mt-2 text-sm text-slate-400">Liens réels extraits des contenus publiés et indexables. Les liens vers blog.2dolist.fr, 2dolist.fr et www.2dolist.fr sont internes.</p></div><button type="button" onClick={() => void load()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500">Actualiser l’analyse</button></div>
    <form className="mt-6 grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-6" onSubmit={(event) => { event.preventDefault(); if (searchScope === 'content') void searchAllContent(); }}>
      <input className={field} value={query} onChange={(event) => { setQuery(event.target.value); setContentMatches(null); }} placeholder={searchScope === 'title' ? 'Rechercher dans le titre…' : 'Mot ou expression…'} aria-label="Rechercher une page" />
      <select className={field} value={searchScope} onChange={(event) => { setSearchScope(event.target.value as SearchScope); setContentMatches(null); }} aria-label="Zone de recherche"><option value="title">Dans le titre</option><option value="content">Dans tout le contenu</option></select>
      <select className={field} value={type} onChange={(event) => { setType(event.target.value as FilterType); if (event.target.value !== 'post') setCategory(''); }} aria-label="Filtrer par type"><option value="all">Tous les types</option><option value="post">Articles</option><option value="category">Catégories</option><option value="static-page">Pages</option></select>
      {type === 'post' ? <select className={field} value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrer par catégorie"><option value="">Toutes les catégories</option>{categories.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select> : <div />}
      <select className={field} value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Trier les pages"><option value="incoming-asc">Entrants croissants</option><option value="incoming-desc">Entrants décroissants</option><option value="outgoing-asc">Sortants croissants</option><option value="outgoing-desc">Sortants décroissants</option><option value="title">Titre</option></select>
      <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={orphansOnly} onChange={(event) => setOrphansOnly(event.target.checked)} /> 0 lien entrant</label>
      {searchScope === 'content' ? <button type="submit" disabled={!query.trim() || contentSearchLoading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50">{contentSearchLoading ? 'Recherche…' : 'Rechercher'}</button> : null}
      {searchScope === 'content' ? <p className="text-xs text-slate-400 md:col-span-6">La lecture de tous les contenus démarre uniquement lorsque vous cliquez sur « Rechercher ».</p> : null}
    </form>
    <p className="mt-4 text-sm text-slate-400">{filtered.length} pages · {pages.filter((item) => item.incomingCount === 0).length} sans lien entrant</p>
    {loading ? <p className="mt-8 text-slate-300">Analyse en cours…</p> : error ? <p className="mt-8 rounded-lg border border-red-900 bg-red-950 p-4 text-red-100" role="alert">{error}</p> : <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
      <table className="w-full text-left text-sm"><thead className="bg-slate-900 text-slate-300"><tr><th className="p-3">Page</th><th className="p-3">Type</th><th className="p-3 text-center">Entrants</th><th className="p-3 text-center">Sortants</th><th className="p-3">Détail</th></tr></thead><tbody className="divide-y divide-slate-800">{visible.map((item) => <Fragment key={item.id}>
        <tr className="bg-slate-950"><td className="p-3"><strong className="text-white">{item.title}</strong><p className="break-all text-xs text-slate-500">{item.url} · FR{item.category ? ` · ${item.category.title}` : ''}</p></td><td className="p-3"><span className="rounded bg-slate-800 px-2 py-1 text-xs">{labels[item.type]}</span></td><td className="p-3 text-center"><span className={item.incomingCount === 0 ? 'rounded bg-red-950 px-2 py-1 font-bold text-red-200' : ''}>{item.incomingCount}</span></td><td className="p-3 text-center">{item.outgoingCount}</td><td className="p-3"><button type="button" className="text-brand-300 underline" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>{expanded === item.id ? 'Fermer' : 'Analyser'}</button></td></tr>
        {expanded === item.id ? <tr className="bg-slate-900"><td colSpan={5} className="grid gap-6 p-5 md:grid-cols-2"><RelationList title="Liens entrants" relations={item.incoming} direction="incoming" /><RelationList title="Liens sortants" relations={item.outgoing} direction="outgoing" /></td></tr> : null}
      </Fragment>)}</tbody></table>
      {!visible.length ? <p className="p-6 text-center text-slate-500">Aucune page ne correspond aux filtres.</p> : null}
    </div>}
    {totalPages > 1 ? <div className="mt-4 flex justify-end gap-3 text-sm"><button className={field} disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Précédent</button><span className="py-2 text-slate-300">{page} / {totalPages}</span><button className={field} disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Suivant</button></div> : null}
  </div>;
}
