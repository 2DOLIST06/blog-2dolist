import type { Locale } from '@/lib/i18n/routing';

export const formatDate = (isoDate: string, locale: Locale = 'en') =>
  new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(isoDate));
