import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { ADMIN_AUTH_COOKIE, buildAdminCookieOptions } from '@/lib/admin/auth';

export async function POST(request: Request) {
  const rawBody = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const body = {
    ...rawBody,
    email: typeof rawBody.email === 'string' ? rawBody.email.trim().toLowerCase() : rawBody.email
  };

  const upstream = await fetch(buildApiUrl('/admin-api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  const payload = (await upstream.json().catch(() => ({}))) as { data?: { token?: string }; token?: string; error?: string };
  const token = payload.data?.token ?? payload.token;

  if (!upstream.ok || !token) {
    return NextResponse.json(payload, { status: upstream.status || 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_AUTH_COOKIE, token, buildAdminCookieOptions());
  return response;
}
