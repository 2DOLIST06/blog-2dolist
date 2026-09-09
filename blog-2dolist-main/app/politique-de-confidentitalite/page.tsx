import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Politique de confidentialité | 2Dolist - Le blog',
  description: 'Consultez la politique de confidentialité du blog 2Dolist et les informations relatives à la gestion des données personnelles.',
  canonicalUrl: 'https://blog.2dolist.fr/politique-de-confidentitalite/',
  noIndex: true,
  follow: true,
  locale: 'fr'
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro="Cette politique explique comment 2DOLIST traite les données personnelles des visiteurs du blog."
    >
      <h2>Responsable du traitement</h2>
      <p>
        Le responsable du traitement est <strong>2DOLIST</strong>, situé au 1735 Route des Comdamines,
        06670 Saint-Martin-du-Var. Le site concerné est <strong>blog.2dolist.fr</strong>. Le numéro SIRET
        de l’établissement est celui de 2DOLIST se terminant par <strong>66</strong>.
      </p>
      <p>
        Pour toute question relative à vos données, vous pouvez utiliser le <Link href="/contact">formulaire de contact</Link> du blog.
      </p>

      <h2>Données traitées et finalités</h2>
      <p>Selon votre utilisation du site, nous pouvons traiter :</p>
      <ul>
        <li>les informations que vous transmettez volontairement via le formulaire de contact ou l’inscription à la newsletter ;</li>
        <li>les données techniques nécessaires à la sécurité et au bon fonctionnement du site, comme l’adresse IP, le navigateur et les journaux de connexion ;</li>
        <li>les données de navigation et de mesure d’audience, lorsque vous y avez consenti.</li>
      </ul>
      <p>
        Ces données servent à répondre aux demandes, envoyer les communications sollicitées, sécuriser le site,
        améliorer son contenu et mesurer son audience. Les traitements reposent, selon le cas, sur votre consentement,
        l’exécution de mesures demandées par vous ou l’intérêt légitime de 2DOLIST à exploiter et sécuriser son blog.
      </p>

      <h2>Destinataires et transferts</h2>
      <p>
        Les données sont accessibles uniquement à 2DOLIST et à ses prestataires techniques dans la limite nécessaire
        à leurs missions (hébergement, maintenance, diffusion de la newsletter et mesure d’audience). Certains services
        tiers peuvent traiter des données hors de l’Espace économique européen. Dans ce cas, 2DOLIST s’appuie sur les
        garanties prévues par la réglementation applicable.
      </p>

      <h2>Durées de conservation</h2>
      <p>
        Les demandes de contact sont conservées le temps nécessaire à leur traitement, puis au maximum trois ans après
        le dernier échange. Les données d’abonnement sont conservées jusqu’au désabonnement. Les journaux techniques et
        données de mesure d’audience sont conservés pour une durée proportionnée à leur finalité et, pour les traceurs,
        dans les limites indiquées dans notre <Link href="/politique-de-cookies">politique de cookies</Link>.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander l’accès, la rectification, l’effacement ou la portabilité de vos données, ainsi que la
        limitation d’un traitement ou vous y opposer. Vous pouvez retirer votre consentement à tout moment, sans remettre
        en cause les traitements déjà réalisés. Pour exercer ces droits, contactez-nous via le formulaire du blog en
        précisant votre demande. Une preuve d’identité peut être demandée uniquement en cas de doute raisonnable.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL.
      </p>

      <h2>Sécurité et évolution de la politique</h2>
      <p>
        2DOLIST met en œuvre des mesures techniques et organisationnelles adaptées pour protéger les données. Cette
        politique peut évoluer pour tenir compte des changements du site ou de la réglementation ; sa date de mise à jour
        figure en haut de la page.
      </p>
    </LegalPage>
  );
}
