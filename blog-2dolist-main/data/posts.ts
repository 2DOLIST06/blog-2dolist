import type { Post } from '@/types/content';

export const posts: Post[] = [
  {
    id: 'p1',
    locale: 'en',
    translationGroupId: 'p1',
    slug: 'programme-prise-de-masse-12-semaines',
    title: 'Programme prise de masse sur 12 semaines : structure, charges et progression',
    excerpt: 'Un plan clair pour construire du muscle avec une surcharge progressive maîtrisée.',
    description: 'Découvre une méthode complète pour organiser 12 semaines de prise de masse avec volume, intensité et deload.',
    coverImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
    publishedAt: '2026-03-18',
    updatedAt: '2026-04-10',
    readingMinutes: 11,
    categorySlug: 'entrainement',
    authorSlug: 'coach-adrien-leroy',
    tags: ['hypertrophie', 'prise de masse', 'programmation'],
    featured: true,
    sections: [
      {
        heading: 'Pourquoi travailler en cycles de 12 semaines ?',
        content: [
          'Un cycle de 12 semaines donne assez de temps pour accumuler du volume utile puis consolider la progression avec un deload planifié.',
          'Tu peux suivre des indicateurs concrets comme le nombre de répétitions validées à charge stable ou la qualité d’exécution sur les mouvements de base.'
        ]
      },
      {
        heading: 'Répartition hebdomadaire recommandée',
        content: [
          '4 séances par semaine en split haut/bas fonctionnent très bien pour la plupart des pratiquants intermédiaires.',
          'Conserve 10 à 16 séries hebdomadaires par groupe musculaire en augmentant progressivement le volume toutes les 3 à 4 semaines.'
        ]
      }
    ]
  },
  {
    id: 'p2',
    locale: 'en',
    translationGroupId: 'p2',
    slug: 'nutrition-prise-de-masse-propre',
    title: 'Nutrition de prise de masse propre : calories, macros et exemples de journée',
    excerpt: 'Comment prendre du muscle sans accumuler trop de gras grâce à une stratégie nutritionnelle durable.',
    description: 'Guide pratique pour fixer tes calories, répartir protéines/glucides/lipides et ajuster semaine après semaine.',
    coverImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
    publishedAt: '2026-02-22',
    readingMinutes: 9,
    categorySlug: 'nutrition',
    authorSlug: 'lea-martin',
    tags: ['nutrition', 'macros', 'prise de masse'],
    featured: true,
    sections: [
      {
        heading: 'Calculer ton surplus calorique intelligemment',
        content: [
          'Commence avec un surplus modéré de 200 à 300 kcal au-dessus de ta maintenance.',
          'Surveille ton poids sur la moyenne de 7 jours et vise environ 0,25 à 0,5 % de prise de poids par semaine.'
        ]
      },
      {
        heading: 'Répartition simple des macros',
        content: [
          'Protéines : 1,6 à 2,2 g/kg de poids de corps.',
          'Lipides : 0,8 à 1 g/kg, puis complète le reste avec des glucides pour soutenir la performance.'
        ]
      }
    ]
  },
  {
    id: 'p3',
    locale: 'en',
    translationGroupId: 'p3',
    slug: 'ameliorer-sommeil-pour-musculation',
    title: 'Améliorer son sommeil pour progresser en musculation',
    excerpt: 'Le sommeil est un levier sous-estimé pour la récupération nerveuse et la progression long terme.',
    description: 'Techniques concrètes pour optimiser ton rythme de sommeil et récupérer plus vite entre les séances.',
    coverImage: 'https://images.unsplash.com/photo-1455642305367-68834a7f74e4',
    publishedAt: '2026-01-30',
    readingMinutes: 7,
    categorySlug: 'recuperation',
    authorSlug: 'coach-adrien-leroy',
    tags: ['récupération', 'sommeil'],
    sections: [
      {
        heading: 'Routine pré-sommeil',
        content: [
          'Réduis l’exposition à la lumière bleue 60 minutes avant de dormir et garde une heure de coucher stable.',
          'Un rituel simple de respiration et d’étirements légers aide à faire baisser la tension nerveuse après les séances tardives.'
        ]
      }
    ]
  },
  {
    id: 'p4',
    locale: 'en',
    translationGroupId: 'p4',
    slug: 'split-push-pull-legs-debutant',
    title: 'Push Pull Legs pour débutant : erreurs fréquentes et plan d’action',
    excerpt: 'Le PPL peut être redoutablement efficace si tu évites les pièges classiques de volume et de récupération.',
    description: 'Une version claire du split Push Pull Legs adaptée aux débutants qui veulent des bases solides.',
    coverImage: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa',
    publishedAt: '2026-03-01',
    readingMinutes: 8,
    categorySlug: 'entrainement',
    authorSlug: 'coach-adrien-leroy',
    tags: ['débutant', 'programmation'],
    sections: [
      {
        heading: 'Les erreurs les plus courantes',
        content: [
          'Vouloir trop d’exercices dès la première semaine nuit souvent à la technique et à la récupération.',
          'Mieux vaut 5 mouvements bien exécutés que 10 exercices bâclés sans progression suivie.'
        ]
      }
    ]
  },
  {
    id: 'p5',
    locale: 'en',
    translationGroupId: 'p5',
    slug: 'pre-workout-cafeine-verite',
    title: 'Pré-workout et caféine : ce qui fonctionne vraiment',
    excerpt: 'Doses efficaces, timing et précautions pour utiliser la caféine sans nuire au sommeil.',
    description: 'Analyse pratique des boosters d’entraînement et des stratégies simples pour préserver tes performances.',
    coverImage: 'https://images.unsplash.com/photo-1579722821273-0f6c2a7f5f15',
    publishedAt: '2026-04-04',
    readingMinutes: 6,
    categorySlug: 'nutrition',
    authorSlug: 'lea-martin',
    tags: ['suppléments', 'caféine'],
    sections: [
      {
        heading: 'Dose et timing',
        content: [
          'Une dose de 2 à 4 mg/kg prise 30 à 60 minutes avant la séance suffit généralement.',
          'Évite les prises tardives si tu es sensible, car la demi-vie de la caféine peut perturber ton sommeil plusieurs heures.'
        ]
      }
    ]
  }
];
