import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';

export async function GET() {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });
  const upstream = await fetch(buildApiUrl('/admin-api/categories'), { headers: authHeaders, cache: 'no-store' });
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
