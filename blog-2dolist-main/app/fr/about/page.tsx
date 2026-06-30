import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'À propos | Body Training Guide',
  description:
    'Body Training Guide est un blog consacré à la musculation, au fitness et aux sports qui sollicitent le corps et les muscles.',
  path: '/fr/about'
});

export default function AboutPage() {
  return (
    <Container>
      <section className="py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-950">À propos de Body Training Guide</h1>

          <p className="mt-6 text-slate-700">
            Body Training Guide est un blog consacré à la musculation, au fitness et aux sports qui sollicitent le
            corps.
          </p>

          <p className="mt-4 text-slate-700">
            Le but est simple : aider à mieux comprendre l’entraînement, les muscles, les exercices et les méthodes
            utilisées pour progresser. Le site s’adresse aux personnes qui veulent s’entraîner avec plus de logique, que
            ce soit pour prendre du muscle, perdre du gras, améliorer leur condition physique ou simplement mieux
            utiliser leur corps.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">Une approche simple de l’entraînement</h2>

          <p className="mt-4 text-slate-700">
            La musculation peut vite devenir compliquée. Il y a beaucoup de programmes, de méthodes, de conseils et
            d’avis différents. Body Training Guide cherche à remettre les choses dans l’ordre, avec des contenus clairs,
            faciles à suivre et centrés sur ce qui compte vraiment.
          </p>

          <p className="mt-4 text-slate-700">
            Chaque article a pour objectif d’expliquer un sujet utile : un groupe musculaire, un exercice, une méthode
            d’entraînement, une erreur fréquente, un programme ou une notion liée au corps.
          </p>

          <p className="mt-4 text-slate-700">
            L’idée n’est pas de vendre une méthode miracle. L’idée est de donner des bases solides pour mieux comprendre
            ce que l’on fait à l’entraînement.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">
            Musculation, fitness et sports liés au corps
          </h2>

          <p className="mt-4 text-slate-700">
            Le blog parle d’abord de musculation, car cette discipline aide à développer la force, les muscles et la
            maîtrise du mouvement. Mais le corps ne se limite pas aux haltères, aux machines ou aux exercices en salle.
          </p>

          <p className="mt-4 text-slate-700">
            Body Training Guide aborde aussi le fitness, la préparation physique, le poids du corps, la mobilité, les
            exercices fonctionnels et les sports où les muscles jouent un rôle direct dans la performance.
          </p>

          <p className="mt-4 text-slate-700">
            Le fil conducteur reste toujours le même : comprendre comment le corps travaille et comment l’entraînement
            peut être organisé de façon plus efficace.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">Des contenus pensés pour être utiles</h2>

          <p className="mt-4 text-slate-700">
            Les articles sont écrits avec un style direct, sans phrases inutiles. Le but n’est pas de remplir des pages
            avec du texte, mais de répondre clairement à une question.
          </p>

          <p className="mt-4 text-slate-700">Vous trouverez par exemple des contenus sur :</p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
            <li>les groupes musculaires du corps ;</li>
            <li>les exercices de musculation ;</li>
            <li>les programmes d’entraînement ;</li>
            <li>les erreurs à éviter ;</li>
            <li>les bases de la progression ;</li>
            <li>le rôle des muscles dans différents mouvements ;</li>
            <li>les liens entre force, posture, mobilité et performance.</li>
          </ul>

          <p className="mt-4 text-slate-700">
            Chaque sujet est traité avec une logique simple : expliquer, organiser, puis aider à passer à l’action.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">Pour qui est fait Body Training Guide ?</h2>

          <p className="mt-4 text-slate-700">
            Body Training Guide s’adresse aux débutants qui veulent comprendre les bases, mais aussi aux pratiquants qui
            cherchent à structurer leur entraînement.
          </p>

          <p className="mt-4 text-slate-700">
            Le site peut être utile si vous voulez savoir quel muscle travaille pendant un exercice, comment organiser
            une séance, pourquoi un mouvement est important ou comment construire une progression plus cohérente.
          </p>

          <p className="mt-4 text-slate-700">
            L’objectif n’est pas de remplacer un coach, un professionnel de santé ou un suivi personnalisé. Le blog sert
            plutôt de guide pour mieux comprendre les notions liées au corps et à l’entraînement.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-950">Notre vision</h2>

          <p className="mt-4 text-slate-700">
            S’entraîner ne devrait pas être confus. Un bon entraînement commence souvent par des choses simples : savoir
            ce que l’on veut travailler, choisir les bons exercices, progresser avec régularité et respecter les limites
            de son corps.
          </p>

          <p className="mt-4 text-slate-700">
            Body Training Guide défend cette approche : moins de bruit, plus de clarté.
          </p>

          <p className="mt-4 text-slate-700">
            Le site avance avec une idée centrale : mieux comprendre son corps permet de mieux s’entraîner.
          </p>
        </div>
      </section>
    </Container>
  );
}
