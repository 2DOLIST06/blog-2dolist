import type { NavigationItem } from '@/types/content';
export { siteConfig } from '@/lib/site/config';

export const mainNavigation: NavigationItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: 'Categories', href: '/categories' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' }
];
