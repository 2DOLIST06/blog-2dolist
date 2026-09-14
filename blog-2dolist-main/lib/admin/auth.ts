import { cookies } from 'next/headers';

export const ADMIN_AUTH_COOKIE = 'admin_jwt';

export type AdminAuthMode = 'jwt' | 'fallback-token' | 'dev-bypass';

export const getAdminAuthMode = (): AdminAuthMode => {
  const mode = process.env.ADMIN_AUTH_MODE;
  if (mode === 'dev-bypass') return 'dev-bypass';
  if (mode === 'fallback-token') return 'fallback-token';
  return 'jwt';
};

export const getAdminJwtFromCookies = async () => {
  const store = await cookies();
  return store.get(ADMIN_AUTH_COOKIE)?.value ?? null;
};

/** Whether the current request belongs to an authenticated administrator. */
export const hasAdminSession = async () => {
  if (getAdminAuthMode() === 'dev-bypass' && process.env.NODE_ENV !== 'production') return true;
  return Boolean(await getAdminJwtFromCookies());
};

export const buildAdminCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 12
});
