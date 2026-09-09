'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CategoryEditorForm, type AdminCategory } from '@/components/admin/CategoryEditorForm';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';
import type { RichContentValue } from '@/components/admin/RichContentEditor';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown) => typeof value === 'string' ? value : '';
const normalize = (payload: unknown): AdminCategory | null => {
  const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const value = isRecord(root) && isRecord(root.category) ? root.category : root;
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const rawJson = isRecord(value.contentJson) ? value.contentJson : {};
  const html = string(value.contentHtml) || string(rawJson.html);
  const contentJson = { ...rawJson, type: 'doc', html } as RichContentValue;
  return { id: value.id, name: string(value.name) || string(value.title), slug: string(value.slug), path: string(value.path), excerpt: string(value.excerpt) || string(value.description), contentHtml: html, contentJson, metaTitle: string(value.metaTitle), metaDescription: string(value.metaDescription), canonicalUrl: string(value.canonicalUrl), isActive: value.isActive !== false, isIndexable: value.isIndexable !== false };
};
export default function AdminCategoryEditPage() {
  const { id } = useParams<{ id: string }>(); const router = useRouter();
  const [category, setCategory] = useState<AdminCategory | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; adminApi.get(`/admin-api/categories/${encodeURIComponent(id)}`).then((payload) => { if (!active) return; const item = normalize(payload); if (item) setCategory(item); else setError('Catégorie introuvable.'); }).catch((reason: unknown) => { if (!active) return; if (reason instanceof AdminApiError && reason.status === 401) return router.replace(`/admin/login?next=/admin/categories/${encodeURIComponent(id)}`); setError(reason instanceof Error ? reason.message : 'Chargement impossible.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id, router]);
  return <section><h1 className="text-3xl font-bold">Modifier la catégorie</h1><p className="mt-2 text-slate-300">Contenu éditorial, publication et SEO.</p>{loading ? <p className="mt-8">Chargement…</p> : null}{error ? <p className="mt-6 rounded border border-red-700 p-3 text-red-300">{error}</p> : null}{category ? <div className="mt-8"><CategoryEditorForm initialCategory={category} /></div> : null}</section>;
}
