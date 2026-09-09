import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Conditions générales d’utilisation | 2DOLIST - Le blog',
  description: 'Conditions générales encadrant l’accès aux contenus et aux liens partenaires du blog 2DOLIST.',
  canonicalUrl: 'https://blog.2dolist.fr/conditions-generales/',
  noIndex: true,
  follow: true,
  locale: 'fr'
});

export default function TermsPage() {
  return (
    <LegalPage title="Conditions générales d’utilisation" intro="Les présentes conditions encadrent l’accès à blog.2dolist.fr et son utilisation.">
      <h2>Éditeur et objet du site</h2>
      <p>
        Le site est édité par <strong>2DOLIST</strong> (SAS / SASU), SIRET <strong>948 606 702 00066</strong>, dont le
        siège social est situé 1735 route des Condamines, 06670 Saint-Martin-du-Var. Le blog publie des informations sur
        les activités de loisirs, notamment les activités aériennes, et peut orienter vers 2DOLIST, des partenaires ou des
        pages de réservation.
      </p>

      <h2>Accès au site</h2>
      <p>
        Le site est normalement accessible sans inscription. Son accès peut être interrompu ou limité, notamment pour la
        maintenance, la sécurité, une évolution technique ou un événement indépendant de la volonté de 2DOLIST. Aucun niveau
        permanent de disponibilité n’est garanti.
      </p>

      <h2>Contenus informatifs</h2>
      <p>
        Les contenus sont fournis à titre informatif. Malgré le soin apporté à leur préparation, ils peuvent devenir
        incomplets ou obsolètes. Ils ne remplacent pas les consignes d’un professionnel, l’évaluation de l’aptitude du
        participant, les règles locales, les conditions météorologiques ou les mesures de sécurité propres à une activité.
      </p>

      <h2>Liens externes et partenaires</h2>
      <p>
        Des liens ou widgets peuvent conduire vers des offres de 2DOLIST ou de tiers et certains liens peuvent être affiliés.
        Lorsqu’une réservation est conclue sur un service tiers, ce service ou le prestataire indiqué détermine les prix,
        disponibilités, conditions de vente, d’annulation et d’exécution. Le blog n’est pas le vendeur direct de toutes les
        prestations présentées et n’est partie au contrat que lorsqu’une page de réservation l’indique expressément.
      </p>

      <h2>Responsabilité</h2>
      <p>
        L’utilisateur vérifie les informations déterminantes directement auprès du prestataire avant toute réservation ou
        participation. 2DOLIST ne répond pas du contenu, de la disponibilité ou de l’exécution des services proposés par
        un tiers, sous réserve des responsabilités qui ne peuvent être exclues par la loi.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La structure, les textes, visuels, marques et autres éléments du site sont protégés et appartiennent à 2DOLIST ou à
        leurs titulaires. Toute utilisation excédant la consultation privée et les exceptions légales requiert une
        autorisation préalable.
      </p>

      <h2>Données personnelles</h2>
      <p>Les traitements de données sont décrits dans la <Link href="/politique-de-confidentitalite/">politique de confidentialité</Link>.</p>

      <h2>Cookies</h2>
      <p>Les traceurs et leur gestion sont présentés dans la <Link href="/politique-de-cookies/">politique de cookies</Link>.</p>

      <h2>Droit applicable</h2>
      <p>
        Les présentes conditions sont régies par le droit français. En cas de différend, une solution amiable sera recherchée
        avant la saisine des juridictions compétentes selon les règles applicables.
      </p>
    </LegalPage>
  );
}
