import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';

const missingSession = () => NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

async function passthrough(request: Request, id: string, method: 'GET' | 'PUT' | 'DELETE') {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return missingSession();

  const upstream = await fetch(buildApiUrl(`/admin-api/posts/${id}`), {
    method,
    headers: { ...authHeaders, ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {}) },
    body: method === 'PUT' ? JSON.stringify(await request.json().catch(() => ({}))) : undefined
  });
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return passthrough(request, id, 'GET');
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return passthrough(request, id, 'PUT');
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return passthrough(request, id, 'DELETE');
}
