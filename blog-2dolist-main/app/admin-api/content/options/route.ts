import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';

export async function GET() {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) {
    return NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });
  }

  const [authorsRes, categoriesRes, tagsRes, mediaRes, postsRes] = await Promise.all([
    fetch(buildApiUrl('/admin-api/authors'), { headers: authHeaders, cache: 'no-store' }),
    fetch(buildApiUrl('/admin-api/categories'), { headers: authHeaders, cache: 'no-store' }),
    fetch(buildApiUrl('/admin-api/tags'), { headers: authHeaders, cache: 'no-store' }),
    fetch(buildApiUrl('/admin-api/media'), { headers: authHeaders, cache: 'no-store' }),
    fetch(buildApiUrl('/admin-api/posts'), { headers: authHeaders, cache: 'no-store' })
  ]);

  const authorsPayload = (await authorsRes.json().catch(() => ({}))) as { data?: unknown[] };
  const categoriesPayload = (await categoriesRes.json().catch(() => ({}))) as { data?: unknown[] };
  const tagsPayload = (await tagsRes.json().catch(() => ({}))) as { data?: unknown[] };
  const mediaPayload = (await mediaRes.json().catch(() => ({}))) as { data?: unknown[] };
  const postsPayload = (await postsRes.json().catch(() => ({}))) as { data?: unknown[] };

  return NextResponse.json({
    authors: authorsPayload.data ?? [],
    categories: categoriesPayload.data ?? [],
    tags: tagsPayload.data ?? [],
    media: mediaPayload.data ?? [],
    posts: postsPayload.data ?? []
  });
}
