import type { NavigationItem } from '@/types/content';
export { siteConfig } from '@/lib/site/config';

export const mainNavigation: NavigationItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: 'Catégories', href: '/categories' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' }
];
