import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Mentions légales | 2DOLIST - Le blog',
  description: 'Informations légales relatives à l’éditeur, à la publication et à l’hébergement du blog 2DOLIST.',
  canonicalUrl: 'https://blog.2dolist.fr/mentions-legales/',
  noIndex: true,
  follow: true,
  locale: 'fr'
});

export default function LegalNoticePage() {
  return (
    <LegalPage
      title="Mentions légales"
      intro="Les présentes mentions identifient l’éditeur de blog.2dolist.fr et précisent les règles applicables à son utilisation."
    >
      <h2>Éditeur du site</h2>
      <ul>
        <li><strong>Raison sociale :</strong> 2DOLIST</li>
        <li><strong>Forme juridique :</strong> SAS / SASU</li>
        <li><strong>Capital social :</strong> 5 000 €</li>
        <li><strong>SIREN :</strong> 948 606 702</li>
        <li><strong>SIRET du siège :</strong> 948 606 702 00066</li>
        <li><strong>Immatriculation :</strong> RCS Nice</li>
        <li><strong>Code APE / NAF :</strong> 63.12Z — Portails Internet</li>
        <li><strong>Siège social :</strong> 1735 route des Condamines, 06670 Saint-Martin-du-Var</li>
        <li><strong>Site :</strong> blog.2dolist.fr</li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>Nicolas Braun.</p>

      <h2>Hébergement et services techniques</h2>
      <p>
        Le front de ce site est hébergé par <strong>Vercel Inc.</strong> Certaines fonctionnalités techniques et API sont
        opérées via <strong>Render</strong>. Les adresses postales des prestataires ne sont pas publiées ici faute
        d’information vérifiée dans le projet.
      </p>

      <h2>Contact</h2>
      <p>
        Pour contacter l’éditeur, utilisez le <Link href="/contact">formulaire de contact</Link>. Aucun autre moyen de
        contact vérifié n’est actuellement publié dans le projet.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La structure du site, les textes, images, signes distinctifs et autres contenus sont protégés par les droits de
        propriété intellectuelle de 2DOLIST ou de leurs titulaires respectifs. Toute reproduction, représentation ou
        exploitation non autorisée, au-delà des exceptions prévues par la loi, est interdite.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Le blog diffuse des informations sur les activités de loisirs, notamment aériennes. 2DOLIST veille à leur qualité
        mais ne garantit ni leur exhaustivité ni leur actualité permanente. Ces contenus ne remplacent pas les consignes
        des professionnels, les conditions des prestataires ou les règles de sécurité propres à chaque activité.
      </p>

      <h2>Liens externes, partenaires et affiliation</h2>
      <p>
        Le site peut contenir des liens d’orientation ou de réservation vers 2DOLIST ou des partenaires. Certains peuvent
        être affiliés et donner lieu à une rémunération, sans modifier le prix affiché à l’utilisateur. Les services tiers
        restent régis par leurs propres informations et conditions ; 2DOLIST ne contrôle pas leur disponibilité permanente.
      </p>

      <h2>Données personnelles et cookies</h2>
      <p>
        Les traitements de données sont détaillés dans la{' '}
        <Link href="/politique-de-confidentitalite/">politique de confidentialité</Link>. L’utilisation des cookies et
        traceurs est expliquée dans la <Link href="/politique-de-cookies/">politique de cookies</Link>.
      </p>
    </LegalPage>
  );
}
