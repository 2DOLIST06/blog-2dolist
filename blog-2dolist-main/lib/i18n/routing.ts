import { siteConfig } from '@/lib/constants';

export type Locale = 'en' | 'fr';
export type Hreflang = 'en' | 'fr' | 'x-default';

export const locales: Locale[] = ['fr'];

const cleanSlug = (slug: string) => slug.replace(/^\/+|\/+$/g, '');
const ensurePathname = (pathname: string) => {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === '/') return '/';
  const pathOnly = trimmed.split(/[?#]/)[0] || '/';
  return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
};

export const getLocaleFromPathname = (pathname: string): Locale => {
  const path = ensurePathname(pathname);
  return 'fr';
};

export const stripLocalePrefix = (pathname: string) => {
  const path = ensurePathname(pathname);
  if (path === '/fr') return '/';
  if (path.startsWith('/fr/')) return path.slice(3) || '/';
  return path;
};

export const localizePath = (path: string, locale: Locale) => {
  const basePath = stripLocalePrefix(path);
  return basePath;
};

export const getHomePath = (locale: Locale) => localizePath('/', locale);
export const getArticlesPath = (locale: Locale) => localizePath('/articles', locale);
export const getCategoriesPath = (locale: Locale) => localizePath('/categories', locale);
export const getAuthorsPath = (locale: Locale) => localizePath('/authors', locale);
export const getArticlePath = (locale: Locale, slug: string) => `${getArticlesPath(locale)}/${cleanSlug(slug)}`;
export const getCategoryPath = (locale: Locale, slug: string) => `${getCategoriesPath(locale)}/${cleanSlug(slug)}`;
export const getAuthorPath = (locale: Locale, slug: string) => `${getAuthorsPath(locale)}/${cleanSlug(slug)}`;
export const getGymPath = (_locale: Locale, slug: string) => `/salles/${cleanSlug(slug)}`;

export const getPathLocale = getLocaleFromPathname;

export const absoluteUrl = (pathOrUrl: string) => {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteConfig.baseUrl}${path}`;
};

export const getNavigation = (_locale: Locale = 'fr') => [
  { label: 'Accueil', href: getHomePath('fr') },
  { label: 'Catégories', href: getCategoriesPath('fr') }
];
