import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Politique de cookies | 2DOLIST - Le blog',
  description: 'Informations sur les cookies, Google Tag Manager et le widget GetYourGuide utilisés par le blog 2DOLIST.',
  canonicalUrl: 'https://blog.2dolist.fr/politique-de-cookies/',
  noIndex: true,
  follow: true,
  locale: 'fr'
});

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Politique de cookies" intro="Cette politique présente les cookies et traceurs susceptibles d’être utilisés sur blog.2dolist.fr.">
      <h2>Définition</h2>
      <p>
        Un cookie est un fichier enregistré ou lu sur un appareil pendant la consultation d’un service en ligne. D’autres
        technologies, comme les balises et identifiants, peuvent remplir des fonctions comparables.
      </p>

      <h2>Cookies nécessaires</h2>
      <p>
        Des cookies ou stockages techniques peuvent être utilisés pour la sécurité, l’acheminement des requêtes et la
        gestion des sessions dans les espaces qui le nécessitent. Leur durée correspond à la session ou à la période
        strictement nécessaire à la fonction concernée.
      </p>

      <h2>Mesure d’audience et balises</h2>
      <p>
        Le code du site charge <strong>Google Tag Manager</strong> (conteneur GTM-PGQQXCNN). Ce gestionnaire permet de
        déployer des balises, mais la configuration publiée du conteneur n’est pas présente dans le dépôt : il n’est donc
        pas possible d’énumérer de façon fiable les traceurs éventuellement activés par son intermédiaire. Des balises de
        mesure d’audience ou de marketing peuvent traiter des données de navigation selon cette configuration.
      </p>

      <h2>Widget et liens partenaires</h2>
      <p>
        Le script du widget <strong>GetYourGuide</strong> est chargé sur le site pour afficher ou permettre l’intégration
        d’offres d’activités. Ce tiers peut recevoir des données techniques ou d’interaction et utiliser ses propres
        traceurs. Un clic sur un lien affilié ou partenaire conduit vers un site tiers, dont la politique s’applique alors.
      </p>

      <h2>Consentement et retrait</h2>
      <p>
        Le projet ne contient actuellement pas de module autonome permettant de modifier les choix de consentement depuis
        le blog. Vous pouvez bloquer ou supprimer les cookies dans les réglages de votre navigateur et utiliser les outils
        d’opposition proposés par les services tiers. Ce choix peut empêcher l’affichage d’un widget ou dégrader certaines
        fonctions. Lorsqu’un dispositif de consentement est proposé, le refus doit être aussi accessible que l’acceptation
        et le choix doit pouvoir être retiré à tout moment.
      </p>

      <h2>Durées indicatives</h2>
      <p>
        Les durées exactes dépendent de la balise configurée et du tiers concerné. Les stockages nécessaires sont limités
        à leur finalité. Lorsqu’un consentement est requis, son choix ne devrait pas être conservé au-delà de six mois sans
        être redemandé. Les cookies non nécessaires ne devraient pas excéder treize mois, sous réserve d’une durée plus
        courte imposée par leur finalité ou paramétrée par le fournisseur.
      </p>

      <h2>Contact</h2>
      <p>
        Cette politique est publiée par <strong>2DOLIST</strong>, SIRET <strong>948 606 702 00066</strong>, 1735 route des
        Condamines, 06670 Saint-Martin-du-Var. Pour toute question, utilisez le <Link href="/contact">formulaire de contact</Link>.
        Consultez également la <Link href="/politique-de-confidentitalite/">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
