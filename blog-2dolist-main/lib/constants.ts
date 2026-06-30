import type { NavigationItem } from '@/types/content';

export const siteConfig = {
  name: 'Body Training Guide',
  description:
    'Strength training, nutrition and recovery guides for sustainable progress.',
  baseUrl: 'https://bodytrainingguide.com',
  defaultOgImage: '/og-default.svg'
};

export const mainNavigation: NavigationItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: 'Categories', href: '/categories' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' }
];
