import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';

const missingSession = () => NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return missingSession();
  const { id } = await params;
  const upstream = await fetch(buildApiUrl(`/admin-api/categories/${encodeURIComponent(id)}`), { headers: authHeaders, cache: 'no-store' });
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return missingSession();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  // The category path and slug are deliberately never accepted from this UI proxy.
  if (body && typeof body === 'object') {
    delete body.path;
    delete body.slug;
  }
  const upstream = await fetch(buildApiUrl(`/admin-api/categories/${encodeURIComponent(id)}`), {
    method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
