import { headers } from 'next/headers';
import { buildApiUrl } from '@/lib/api/env';
import { getAdminAuthMode, getAdminJwtFromCookies } from '@/lib/admin/auth';

const looksLikeJwt = (token: string) => token.split('.').length === 3;

export async function resolveUpstreamAdminToken(sessionToken: string) {
  if (looksLikeJwt(sessionToken)) return sessionToken;

  const staticToken = process.env.ADMIN_ACCESS_TOKEN;
  const staticEmail = process.env.ADMIN_EMAIL;
  const staticPassword = process.env.ADMIN_PASSWORD;

  if (!staticToken || !staticEmail || !staticPassword || sessionToken !== staticToken) return null;

  const loginRes = await fetch(buildApiUrl('/admin-api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staticEmail, password: staticPassword }),
    cache: 'no-store'
  });

  const payload = (await loginRes.json().catch(() => ({}))) as { data?: { token?: string }; token?: string };
  const token = payload.data?.token ?? payload.token;
  return loginRes.ok && token ? token : null;
}

export async function getUpstreamAdminToken() {
  const mode = getAdminAuthMode();

  if (mode === 'dev-bypass' && process.env.NODE_ENV !== 'production') {
    console.warn('[admin-auth] dev-bypass mode active. Never enable in production.');
    return { token: null, mode, bypass: true } as const;
  }

  const jwt = await getAdminJwtFromCookies();
  if (jwt) return { token: jwt, mode, bypass: false } as const;

  if (mode === 'fallback-token') {
    const staticToken = process.env.ADMIN_ACCESS_TOKEN ?? '';
    if (!staticToken) return { token: null, mode, bypass: false } as const;
    return { token: await resolveUpstreamAdminToken(staticToken), mode, bypass: false } as const;
  }

  return { token: null, mode, bypass: false } as const;
}

export async function buildUpstreamAuthHeaders(): Promise<Record<string, string> | null> {
  const session = await getUpstreamAdminToken();
  if (session.bypass) return {};
  if (session.token) return { Authorization: `Bearer ${session.token}` };

  const h = await headers();
  const incoming = h.get('authorization');
  if (incoming?.toLowerCase().startsWith('bearer ')) return { Authorization: incoming };

  return null;
}
