import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';
import { analyzeInternalLinking, type AnalysisPageInput } from '@/lib/admin/linking-analysis';
import { staticInternalPages } from '@/lib/admin/static-internal-pages';
import { getArticlePath, getCategoryPath } from '@/lib/i18n/routing';
import type { InternalLinkType } from '@/types/internal-links';

type Item = Record<string, unknown>;
type Payload = { data?: unknown; meta?: Record<string, unknown>; pagination?: Record<string, unknown> };
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const record = (value: unknown): Item | undefined => value && typeof value === 'object' && !Array.isArray(value) ? value as Item : undefined;
const list = (payload: Payload) => Array.isArray(payload.data) ? payload.data.filter((item): item is Item => Boolean(record(item))) : [];
const contentHtml = (item: Item) => {
  const json = record(item.contentJson);
  const blocks = Array.isArray(json?.blocks) ? json.blocks : [];
  return text(item.contentHtml) || text(json?.html) || blocks.map((block) => {
    const value = record(block);
    return text(value?.html) || text(value?.content) || text(value?.value) || text(value?.markup) || text(value?.rawHtml) || text(value?.body);
  }).join('');
};
const pageHtml = (item: Item) => {
  const faqs = Array.isArray(item.faqJson) ? item.faqJson : [];
  return [
    text(item.chapoHtml),
    contentHtml(item),
    ...faqs.map((faq) => text(record(faq)?.answer))
  ].join('');
};

const totalPages = (payload: Payload) => {
  const source = payload.meta ?? payload.pagination ?? {};
  for (const key of ['totalPages', 'pageCount', 'lastPage']) {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
};

async function fetchAll(path: string, headers: Record<string, string>) {
  const results: Item[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const response = await fetch(buildApiUrl(`${path}?page=${page}&limit=100`), { headers, cache: 'no-store' });
    const payload = await response.json().catch(() => ({})) as Payload;
    if (!response.ok) throw new Error(`upstream:${response.status}`);
    const items = list(payload);
    results.push(...items);
    const pages = totalPages(payload);
    if ((pages && page >= pages) || (!pages && items.length < 100)) return results;
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

const toPage = (item: Item, type: InternalLinkType): AnalysisPageInput | undefined => {
  const id = text(item.id);
  const slug = text(item.slug);
  const title = text(item.title) || text(item.name) || text(item.h1) || slug;
  if (!id || !slug || !title || item.isActive === false || item.isIndexable === false) return;
  if (type === 'post' && item.status !== undefined && item.status !== 'PUBLISHED') return;
  const fallback = type === 'post' ? getArticlePath('fr', slug) : getCategoryPath('fr', slug);
  const url = text(item.path) || fallback;
  return { id: `${type}:${id}`, type, title, url, html: pageHtml(item), locale: 'fr', category: type === 'post' ? categoryOf(item) : undefined };
};

export async function GET() {
  const headers = await buildUpstreamAuthHeaders();
  if (headers === null) return NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });
  try {
    const [posts, categories] = await Promise.all([
      fetchAll('/admin-api/posts', headers),
      fetchAll('/admin-api/categories', headers)
    ]);
    const inputs: AnalysisPageInput[] = [
      ...posts.map((item) => toPage(item, 'post')).filter((item): item is AnalysisPageInput => Boolean(item)),
      ...categories.map((item) => toPage(item, 'category')).filter((item): item is AnalysisPageInput => Boolean(item)),
      ...staticInternalPages.map((item) => ({ id: `${item.type}:${item.id}`, type: item.type, title: item.title, url: item.href, locale: item.locale }))
    ];
    return NextResponse.json({ data: analyzeInternalLinking(inputs), generatedAt: new Date().toISOString() });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'upstream:401';
    return NextResponse.json({ error: unauthorized ? 'Session admin expirée. Reconnectez-vous.' : 'Analyse du maillage indisponible.' }, { status: unauthorized ? 401 : 502 });
  }
}
