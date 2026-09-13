import type { InternalLinkDestination } from '@/types/internal-links';

// Deliberately excludes legal/noindex pages.
export const staticInternalPages: InternalLinkDestination[] = [
  { id: 'home', type: 'static-page', title: 'Accueil', href: '/', locale: 'fr', source: 'blog' },
  { id: 'about', type: 'static-page', title: 'À propos', href: '/about', locale: 'fr', source: 'blog' },
  { id: 'contact', type: 'static-page', title: 'Contact', href: '/contact', locale: 'fr', source: 'blog' }
];
