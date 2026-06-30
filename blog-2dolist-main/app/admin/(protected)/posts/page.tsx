'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';
import type { Locale } from '@/lib/i18n/routing';

interface PostRow {
  id: string;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  isIndexable?: boolean | null;
  robots?: string | null;
  categorySlug?: string | null;
  updatedAt?: string | null;
  locale?: Locale | null;
  translationGroupId?: string | null;
  translations?: Array<{ locale?: Locale | null }> | null;
}

type PostsPayload =
  | PostRow[]
  | {
      data?: PostRow[] | { data?: PostRow[]; posts?: PostRow[]; items?: PostRow[]; docs?: PostRow[] };
      posts?: PostRow[];
      items?: PostRow[];
      docs?: PostRow[];
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const extractPosts = (payload: PostsPayload): PostRow[] => {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of ['data', 'posts', 'items', 'docs'] as const) {
    const value = payload[key];
    if (Array.isArray(value)) return value as PostRow[];
    if (isRecord(value)) {
      for (const nestedKey of ['data', 'posts', 'items', 'docs'] as const) {
        const nestedValue = value[nestedKey];
        if (Array.isArray(nestedValue)) return nestedValue as PostRow[];
      }
    }
  }

  return [];
};

const formatBoolean = (value?: boolean | null) => (typeof value === 'boolean' ? String(value) : '—');

export default function AdminPostsListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    adminApi
      .get<PostsPayload>('/admin-api/posts')
      .then((payload) => {
        if (!mounted) return;
        setRows(extractPosts(payload));
        setError(null);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        if (err instanceof AdminApiError && err.status === 401) {
          router.replace('/admin/login?next=/admin/posts');
          return;
        }
        setRows([]);
        setError(err instanceof AdminApiError ? err.message : 'Impossible de charger la liste des articles.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Articles</h1>
        <Link href="/admin/posts/new" className="rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
          Nouveau
        </Link>
      </div>

      {loading ? <p className="mt-6 text-sm text-slate-500">Chargement des articles…</p> : null}

      {error ? (
        <div className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <p className="mt-6 rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Aucun article retourné par l’API admin.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="mt-6 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2">title</th>
                <th className="px-3 py-2">langue</th>
                <th className="px-3 py-2">slug</th>
                <th className="px-3 py-2">translationGroupId</th>
                <th className="px-3 py-2">traductions</th>
                <th className="px-3 py-2">status</th>
                <th className="px-3 py-2">isActive</th>
                <th className="px-3 py-2">isIndexable</th>
                <th className="px-3 py-2">robots</th>
                <th className="px-3 py-2">category</th>
                <th className="px-3 py-2">updatedAt</th>
                <th className="px-3 py-2">actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((post) => (
                <tr key={post.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{post.title || '—'}</td>
                  <td className="px-3 py-2">{post.locale ?? 'en'}</td>
                  <td className="px-3 py-2">{post.slug || '—'}</td>
                  <td className="px-3 py-2">{post.translationGroupId || '—'}</td>
                  <td className="px-3 py-2">{post.translations?.map((translation) => translation.locale).filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-3 py-2">{post.status || '—'}</td>
                  <td className="px-3 py-2">{formatBoolean(post.isActive)}</td>
                  <td className="px-3 py-2">{formatBoolean(post.isIndexable)}</td>
                  <td className="px-3 py-2">{post.robots || '—'}</td>
                  <td className="px-3 py-2">{post.categorySlug || '—'}</td>
                  <td className="px-3 py-2">{post.updatedAt || '—'}</td>
                  <td className="px-3 py-2">
                    <Link className="font-medium text-slate-900 underline" href={`/admin/posts/${post.id}`}>
                      Éditer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
