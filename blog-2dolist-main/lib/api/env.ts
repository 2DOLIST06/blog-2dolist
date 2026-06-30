const API_DEFAULT_BASE_URL = process.env.API_DEFAULT_BASE_URL?.trim() || '';

const normalizeBaseUrl = (value: string | undefined) => {
  const trimmed = value?.trim().replace(/\/+$/, '');
  return trimmed || undefined;
};

const getHostname = (value: string | undefined) => {
  if (!value) return undefined;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return undefined;
  }
};

const FRONTEND_HOSTS = new Set(
  (process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : [])
    .map((url) => getHostname(url))
    .filter((hostname): hostname is string => Boolean(hostname))
);

const isFrontendUrl = (value: string | undefined) => {
  const hostname = getHostname(value);
  return hostname ? FRONTEND_HOSTS.has(hostname) : false;
};

export const getApiBaseUrl = () => {
  const serverApiUrl = normalizeBaseUrl(process.env.API_BASE_URL);
  if (serverApiUrl) return serverApiUrl;

  const publicApiUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (publicApiUrl && !isFrontendUrl(publicApiUrl)) return publicApiUrl;

  return API_DEFAULT_BASE_URL;
};

export const getPublicApiBaseUrl = () => {
  const publicApiUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (publicApiUrl && !isFrontendUrl(publicApiUrl)) return publicApiUrl;

  return getApiBaseUrl();
};

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

export const buildPublicApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getPublicApiBaseUrl()}${normalizedPath}`;
};
