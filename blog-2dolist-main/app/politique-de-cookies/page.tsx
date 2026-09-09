import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Politique de cookies | 2Dolist - Le blog',
  description: 'Consultez la politique de cookies du blog 2Dolist et les informations relatives aux traceurs utilisés sur le site.',
  canonicalUrl: 'https://blog.2dolist.fr/politique-de-cookies/',
  noIndex: true,
  follow: true,
  locale: 'fr'
});

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Politique de cookies"
      intro="Cette page décrit les cookies et autres traceurs susceptibles d’être utilisés sur blog.2dolist.fr."
    >
      <h2>Qu’est-ce qu’un cookie ?</h2>
      <p>
        Un cookie est un petit fichier enregistré ou lu sur votre appareil lors de la consultation d’un site. Certains
        traceurs sont indispensables au service ; d’autres nécessitent votre consentement avant d’être déposés ou lus.
      </p>

      <h2>Traceurs utilisés sur le blog</h2>
      <h3>Cookies nécessaires</h3>
      <p>
        Des cookies techniques peuvent assurer la sécurité, la continuité de navigation et, dans les espaces concernés,
        la gestion d’une session. Ils ne sont pas utilisés à des fins publicitaires et ne peuvent pas être désactivés par
        les réglages de consentement lorsqu’ils sont strictement nécessaires.
      </p>

      <h3>Mesure d’audience</h3>
      <p>
        Le site intègre <strong>Google Tag Manager</strong>, un gestionnaire de balises. Le code du blog ne permet pas de
        connaître la configuration publiée dans ce conteneur. Google Tag Manager sert à charger et administrer des balises ;
        les éventuels traceurs de mesure d’audience réellement déposés dépendent donc de sa configuration active.
      </p>

      <h3>Contenus et widgets tiers</h3>
      <p>
        Des pages peuvent afficher un widget <strong>GetYourGuide</strong> afin de présenter des activités et d’orienter
        vers une offre de réservation. Ce service tiers peut recevoir des informations techniques ou déposer des traceurs
        lors de son chargement ou d’une interaction. Ses propres règles de confidentialité s’appliquent ensuite sur son site.
      </p>

      <h3>Publicité et suivi</h3>
      <p>
        Aucun script Meta Pixel ou Microsoft Clarity n’est directement intégré au code du blog à la date de mise à jour de
        cette politique. Des balises publicitaires ou de suivi ne doivent être activées via Google Tag Manager qu’après
        votre consentement lorsqu’il est requis.
      </p>

      <h2>Gérer ou retirer votre consentement</h2>
      <p>
        Lorsqu’un module de consentement est affiché, vous pouvez accepter, refuser ou personnaliser les traceurs non
        essentiels, puis modifier votre choix depuis les réglages de confidentialité proposés sur le site. Vous pouvez
        également supprimer ou bloquer les cookies dans les paramètres de votre navigateur. Ce blocage peut altérer
        certaines fonctions ou empêcher l’affichage d’un contenu tiers.
      </p>

      <h2>Durées de conservation</h2>
      <p>
        La durée varie selon le traceur et sa finalité. Les cookies nécessaires sont conservés pendant la session ou pour
        la durée strictement utile au service. Le choix de consentement est conservé pendant une durée indicative de six
        mois avant d’être demandé à nouveau. Les autres traceurs ne doivent pas dépasser treize mois, sous réserve d’une
        durée plus courte définie par le service concerné. Les données issues de la mesure d’audience sont conservées pour
        une durée limitée, adaptée à l’analyse statistique.
      </p>

      <h2>Contact</h2>
      <p>
        Cette politique est publiée par <strong>2DOLIST</strong>, 1735 Route des Comdamines, 06670 Saint-Martin-du-Var.
        Le numéro SIRET de l’établissement est celui de 2DOLIST se terminant par <strong>66</strong>. Pour toute question,
        utilisez notre <Link href="/contact">formulaire de contact</Link>. Pour en savoir plus sur vos données personnelles,
        consultez notre <Link href="/politique-de-confidentitalite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
