'use client';

import { FormEvent, useState } from 'react';
import { adminApi, uploadAdminImage } from '@/lib/admin/api-client';
import { RichContentEditor, type RichContentValue } from '@/components/admin/RichContentEditor';

export type AdminCategory = {
  id: string; name: string; slug: string; path: string; excerpt: string; contentHtml: string;
  contentJson: RichContentValue; metaTitle: string; metaDescription: string; canonicalUrl: string;
  isActive: boolean; isIndexable: boolean;
};
const field = 'w-full rounded border border-slate-600 bg-white p-2 text-slate-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';

export function CategoryEditorForm({ initialCategory }: { initialCategory: AdminCategory }) {
  const [category, setCategory] = useState(initialCategory);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      // path and slug are intentionally omitted: the backend remains their sole owner.
      await adminApi.put(`/admin-api/categories/${encodeURIComponent(category.id)}`, {
        name: category.name, excerpt: category.excerpt, contentHtml: category.contentJson.html,
        contentJson: category.contentJson, metaTitle: category.metaTitle, metaDescription: category.metaDescription,
        canonicalUrl: category.canonicalUrl || null, isActive: category.isActive, isIndexable: category.isIndexable
      });
      setNotice('Catégorie enregistrée. Son path et son slug n’ont pas été envoyés ni modifiés.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  };
  return <form onSubmit={save} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <div className="space-y-5">
      <label className="block text-sm font-medium">Nom public<input required className={`${field} mt-1`} value={category.name} onChange={(e) => setCategory({ ...category, name: e.target.value })} /></label>
      <label className="block text-sm font-medium">Extrait / introduction<textarea rows={4} className={`${field} mt-1`} value={category.excerpt} onChange={(e) => setCategory({ ...category, excerpt: e.target.value })} /></label>
      <div><p className="mb-2 text-sm font-medium">Contenu éditorial riche</p><RichContentEditor value={category.contentJson} onChange={(value) => setCategory({ ...category, contentJson: value, contentHtml: value.html })} onUploadImage={async (file) => { const image = await uploadAdminImage(file, 'editor'); return { url: image.url }; }} /></div>
    </div>
    <aside className="space-y-4">
      <div className="rounded border border-slate-700 bg-slate-900 p-3"><label className="text-sm font-medium">Path (lecture seule)<input readOnly className={`${field} mt-1 cursor-not-allowed bg-slate-200`} value={category.path} /></label><p className="mt-2 text-xs text-amber-300">URL historique prioritaire : ce champ n’est jamais envoyé lors de la sauvegarde.</p></div>
      <label className="block text-sm font-medium">Slug (lecture seule)<input readOnly className={`${field} mt-1 cursor-not-allowed bg-slate-200`} value={category.slug} /></label>
      <label className="block text-sm font-medium">Title SEO<input className={`${field} mt-1`} value={category.metaTitle} onChange={(e) => setCategory({ ...category, metaTitle: e.target.value })} /></label>
      <label className="block text-sm font-medium">Meta description<textarea rows={4} className={`${field} mt-1`} value={category.metaDescription} onChange={(e) => setCategory({ ...category, metaDescription: e.target.value })} /></label>
      <label className="block text-sm font-medium">Canonical optionnelle<input type="url" className={`${field} mt-1`} placeholder="https://blog.2dolist.fr/category/…/" value={category.canonicalUrl} onChange={(e) => setCategory({ ...category, canonicalUrl: e.target.value })} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={category.isIndexable} onChange={(e) => setCategory({ ...category, isIndexable: e.target.checked })} /> Indexable</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={category.isActive} onChange={(e) => setCategory({ ...category, isActive: e.target.checked })} /> Active</label>
      {error ? <p className="rounded border border-red-700 p-3 text-sm text-red-300">{error}</p> : null}{notice ? <p className="rounded border border-emerald-700 p-3 text-sm text-emerald-300">{notice}</p> : null}
      <button disabled={saving} className="w-full rounded bg-brand-700 px-4 py-2 font-medium text-white disabled:opacity-60">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
    </aside>
  </form>;
}
