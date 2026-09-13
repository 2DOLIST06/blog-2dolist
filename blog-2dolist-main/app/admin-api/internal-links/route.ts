import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';
import { staticInternalPages } from '@/lib/admin/static-internal-pages';
import { getArticlePath, getCategoryPath } from '@/lib/i18n/routing';
import type { InternalLinkDestination, InternalLinkType } from '@/types/internal-links';

type Item = Record<string, unknown>;
type UpstreamPayload = { data?: unknown; meta?: Record<string, unknown>; pagination?: Record<string, unknown> };

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const record = (value: unknown): Item | undefined => value && typeof value === 'object' && !Array.isArray(value) ? value as Item : undefined;
const list = (payload: UpstreamPayload) => Array.isArray(payload.data) ? payload.data.filter((item): item is Item => Boolean(record(item))) : [];
const fold = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
const relativeHref = (preferred: string, fallback: string, canonical: string) => {
  if (preferred.startsWith('/')) return preferred;
  if (fallback) return fallback;
  try { return new URL(canonical).pathname || '/'; } catch { return ''; }
};

const getTotalPages = (payload: UpstreamPayload) => {
  const source = payload.meta ?? payload.pagination ?? {};
  for (const key of ['totalPages', 'pageCount', 'lastPage']) {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return undefined;
};

async function fetchAll(path: string, headers: Record<string, string>) {
  const pageSize = 100;
  const result: Item[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const response = await fetch(buildApiUrl(`${path}${separator}page=${page}&limit=${pageSize}`), { headers, cache: 'no-store' });
    const payload = await response.json().catch(() => ({})) as UpstreamPayload;
    if (!response.ok) throw new Error(`upstream:${response.status}`);
    const items = list(payload);
    result.push(...items);
    const totalPages = getTotalPages(payload);
    if ((totalPages && page >= totalPages) || (!totalPages && items.length < pageSize)) return result;
  }
  throw new Error('upstream:pagination-limit');
}

const categoryOf = (item: Item) => {
  const category = record(item.category);
  const id = text(item.categoryId) || text(category?.id);
  const slug = text(item.categorySlug) || text(category?.slug);
  const title = text(category?.title) || text(category?.name) || slug;
  return id || slug ? { id, slug, title } : undefined;
};

const postDestination = (item: Item): InternalLinkDestination | undefined => {
  const slug = text(item.slug);
  const title = text(item.title) || text(item.h1);
  if (!text(item.id) || !slug || !title) return;
  if (item.status !== undefined && item.status !== 'PUBLISHED') return;
  if (item.isActive === false || item.isIndexable === false) return;
  const href = relativeHref(text(item.path), getArticlePath('fr', slug), text(item.canonicalUrl));
  if (!href) return;
  return { id: text(item.id), type: 'post', title, slug, href, locale: 'fr', category: categoryOf(item), source: 'blog' };
};

const categoryDestination = (item: Item): InternalLinkDestination | undefined => {
  const slug = text(item.slug);
  const title = text(item.title) || text(item.name) || slug;
  if (!text(item.id) || !slug || !title || item.isActive === false || item.isIndexable === false) return;
  const href = relativeHref(text(item.path), getCategoryPath('fr', slug), text(item.canonicalUrl));
  return { id: text(item.id), type: 'category', title, slug, href, locale: 'fr', source: 'blog' };
};

export async function GET(request: Request) {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const requestedType = params.get('type') ?? 'all';
  const allowed = new Set(['all', 'post', 'category', 'static-page']);
  if (!allowed.has(requestedType)) return NextResponse.json({ error: 'Type de destination invalide.' }, { status: 400 });
  if ((params.get('locale') ?? 'fr') !== 'fr') return NextResponse.json({ error: 'Seule la locale fr est disponible.' }, { status: 400 });
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(params.get('limit') ?? '20', 10) || 20));
  const categoryId = params.get('categoryId')?.trim() ?? '';
  const query = fold(params.get('q')?.trim() ?? '');

  try {
    const type = requestedType as InternalLinkType | 'all';
    const [posts, categories] = await Promise.all([
      type === 'all' || type === 'post' ? fetchAll('/admin-api/posts', authHeaders) : Promise.resolve([]),
      type === 'all' || type === 'category' ? fetchAll('/admin-api/categories', authHeaders) : Promise.resolve([])
    ]);
    const destinations = [
      ...posts.map(postDestination).filter((item): item is InternalLinkDestination => Boolean(item)),
      ...categories.map(categoryDestination).filter((item): item is InternalLinkDestination => Boolean(item)),
      ...(type === 'all' || type === 'static-page' ? staticInternalPages : [])
    ].filter((item) => !categoryId || (item.type === 'post' && item.category?.id === categoryId))
      .filter((item) => !query || fold([item.title, item.slug, item.href].filter(Boolean).join(' ')).includes(query));
    const start = (page - 1) * limit;
    return NextResponse.json({ data: destinations.slice(start, start + limit), pagination: { page, limit, total: destinations.length, totalPages: Math.ceil(destinations.length / limit) } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'upstream:401' ? 401 : 502;
    return NextResponse.json({ error: status === 401 ? 'Session admin expirée. Reconnectez-vous.' : 'Recherche de liens internes indisponible.' }, { status });
  }
}
