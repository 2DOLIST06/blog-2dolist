import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';

const missingSession = () => NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

export async function POST(request: Request) {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return missingSession();

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Formulaire upload invalide.' }, { status: 400 });

  const upstream = await fetch(buildApiUrl('/admin-api/media/upload'), {
    method: 'POST',
    headers: authHeaders,
    body: formData,
    cache: 'no-store'
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json'
    }
  });
}
