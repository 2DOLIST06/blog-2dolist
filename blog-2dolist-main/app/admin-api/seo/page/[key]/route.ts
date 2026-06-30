import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';
import { type Locale } from '@/lib/i18n/routing';

const missingSession = () => NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

const getLocale = (request: Request): Locale => {
  const locale = new URL(request.url).searchParams.get('locale');
  return locale === 'fr' ? 'fr' : 'en';
};

async function passthrough(request: Request, key: string, method: 'GET' | 'PUT') {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return missingSession();

  const locale = getLocale(request);
  const upstream = await fetch(buildApiUrl(`/admin-api/seo/page/${key}?locale=${locale}`), {
    method,
    headers: { ...authHeaders, ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {}) },
    body: method === 'PUT' ? JSON.stringify(await request.json().catch(() => ({}))) : undefined,
    cache: 'no-store'
  });
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return passthrough(request, key, 'GET');
}

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return passthrough(request, key, 'PUT');
}
