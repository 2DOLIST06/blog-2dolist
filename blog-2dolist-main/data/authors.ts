import type { Author } from '@/types/content';

export const authors: Author[] = [
  {
    id: 'a1',
    slug: 'coach-adrien-leroy',
    name: 'Adrien Leroy',
    role: 'Coach en hypertrophie',
    bio: 'Coach spécialisé en progression naturelle, Adrien accompagne des pratiquants intermédiaires vers un entraînement plus intelligent et durable.',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5',
    socials: { instagram: 'https://instagram.com' }
  },
  {
    id: 'a2',
    slug: 'lea-martin',
    name: 'Léa Martin',
    role: 'Nutritionniste sportive',
    bio: 'Léa construit des stratégies nutritionnelles réalistes pour les sportifs qui veulent performer sans sacrifier leur santé.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    socials: { linkedin: 'https://linkedin.com' }
  }
];
