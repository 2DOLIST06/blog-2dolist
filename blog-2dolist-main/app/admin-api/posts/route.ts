import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';

const missingSession = () => NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

export async function GET() {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return missingSession();

  const upstream = await fetch(buildApiUrl('/admin-api/posts'), {
    headers: authHeaders,
    cache: 'no-store'
  });
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}

export async function POST(request: Request) {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return missingSession();

  const body = await request.json().catch(() => ({}));
  const upstream = await fetch(buildApiUrl('/admin-api/posts'), {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
