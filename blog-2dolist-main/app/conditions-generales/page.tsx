import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Conditions générales | 2Dolist - Le blog',
  description: 'Consultez les conditions générales applicables au blog 2Dolist et à l’utilisation du site.',
  canonicalUrl: 'https://blog.2dolist.fr/conditions-generales/',
  noIndex: true,
  follow: true,
  locale: 'fr'
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Conditions générales"
      intro="Les présentes conditions encadrent l’accès au blog 2Dolist et son utilisation."
    >
      <h2>Éditeur et objet du site</h2>
      <p>
        Le site <strong>blog.2dolist.fr</strong> est édité par <strong>2DOLIST</strong>, situé au 1735 Route des
        Comdamines, 06670 Saint-Martin-du-Var. Le numéro SIRET de l’établissement est celui de 2DOLIST se terminant
        par <strong>66</strong>. Vous pouvez contacter l’éditeur au moyen du <Link href="/contact">formulaire de contact</Link>.
      </p>
      <p>
        Le blog propose des contenus d’information, de réservation et d’orientation autour des activités de loisirs et
        des activités aériennes. Toute consultation du site implique l’acceptation des présentes conditions.
      </p>

      <h2>Information et disponibilité</h2>
      <p>
        2DOLIST s’efforce de fournir des informations utiles et à jour, sans garantir qu’elles soient exhaustives ou
        exemptes d’erreur. Les contenus ne remplacent ni les consignes d’un professionnel ni les règles de sécurité propres
        à chaque activité. L’accès au site peut être suspendu pour maintenance, sécurité ou en cas de force majeure.
      </p>

      <h2>Réservation et services de tiers</h2>
      <p>
        Le blog peut orienter vers des prestataires ou plateformes partenaires, notamment au moyen de liens ou widgets.
        Une réservation réalisée sur un service tiers est conclue directement avec le prestataire concerné et relève de
        ses propres prix, disponibilités, conditions de vente, d’annulation et de responsabilité. L’utilisateur doit les
        consulter avant toute commande. 2DOLIST n’est pas partie à ce contrat, sauf indication expresse contraire.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La structure du site, ses textes, visuels, marques et autres contenus sont protégés par les droits de propriété
        intellectuelle de 2DOLIST ou de leurs titulaires. Toute reproduction ou exploitation au-delà d’un usage privé,
        sans autorisation préalable, est interdite. Les marques et contenus de tiers restent la propriété de leurs auteurs.
      </p>

      <h2>Liens externes et responsabilité</h2>
      <p>
        Les liens externes sont proposés à titre pratique. 2DOLIST ne contrôle pas en permanence leur contenu ni leur
        disponibilité. Chaque utilisateur demeure responsable de ses choix, de la vérification des conditions d’une
        activité et du respect des consignes de sécurité, restrictions médicales, règles locales et conditions météo.
      </p>

      <h2>Données personnelles et cookies</h2>
      <p>
        Le traitement des données personnelles et l’utilisation des traceurs sont décrits dans la{' '}
        <Link href="/politique-de-confidentitalite">politique de confidentialité</Link> et la{' '}
        <Link href="/politique-de-cookies">politique de cookies</Link>.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de difficulté, les parties rechercheront d’abord
        une solution amiable. À défaut, le litige sera porté devant les juridictions compétentes selon les règles légales applicables.
      </p>
    </LegalPage>
  );
}
