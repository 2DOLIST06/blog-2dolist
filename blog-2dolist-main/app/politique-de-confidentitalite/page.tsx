import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Politique de confidentialité | 2DOLIST - Le blog',
  description: 'Découvrez comment 2DOLIST traite les données personnelles des visiteurs de son blog.',
  canonicalUrl: 'https://blog.2dolist.fr/politique-de-confidentitalite/',
  noIndex: true,
  follow: true,
  locale: 'fr'
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Politique de confidentialité" intro="Cette politique décrit les traitements de données personnelles susceptibles d’intervenir sur blog.2dolist.fr.">
      <h2>Responsable du traitement</h2>
      <p>
        Le responsable du traitement est <strong>2DOLIST</strong> (SAS / SASU), SIRET <strong>948 606 702 00066</strong>,
        dont le siège social est situé 1735 route des Condamines, 06670 Saint-Martin-du-Var.
      </p>
      <p>Pour toute question ou demande relative à vos droits, utilisez le <Link href="/contact">formulaire de contact</Link>.</p>

      <h2>Données susceptibles d’être collectées</h2>
      <ul>
        <li>les informations fournies dans un formulaire de contact, telles que votre identité, vos coordonnées, l’objet et le contenu du message ;</li>
        <li>les informations fournies lors d’une éventuelle inscription à la newsletter ;</li>
        <li>les données techniques nécessaires au fonctionnement et à la sécurité, notamment adresse IP, navigateur, appareil et journaux de connexion ;</li>
        <li>les données de navigation et d’interaction issues des traceurs chargés par Google Tag Manager ou du widget GetYourGuide.</li>
      </ul>
      <p>
        Elles peuvent servir à traiter vos demandes, fournir les communications sollicitées, exploiter et sécuriser le site,
        établir des statistiques et orienter les visiteurs vers des activités ou partenaires. Selon le traitement, la base
        juridique est votre consentement, l’exécution de mesures prises à votre demande, une obligation légale ou l’intérêt
        légitime de 2DOLIST à administrer et sécuriser le blog.
      </p>

      <h2>Audience, traceurs et services partenaires</h2>
      <p>
        Le site charge Google Tag Manager. La configuration des balises publiées dans ce conteneur n’est pas visible dans
        le code source du projet et peut donc faire évoluer les outils de mesure effectivement déclenchés. Le site charge
        aussi le script du widget GetYourGuide, susceptible de traiter des données techniques et d’interaction. Les liens
        affiliés ou partenaires peuvent transmettre au site de destination des informations nécessaires à l’attribution
        d’une visite ou d’une réservation. Consultez la <Link href="/politique-de-cookies/">politique de cookies</Link>.
      </p>

      <h2>Destinataires et transferts</h2>
      <p>
        Les données sont accessibles aux personnes habilitées de 2DOLIST et, dans la seule mesure nécessaire, à ses
        prestataires techniques, d’hébergement, de communication, d’audience et partenaires concernés. Certains prestataires
        peuvent traiter des données hors de l’Espace économique européen ; les garanties applicables dépendent alors du
        service et du mécanisme de transfert qu’il met en œuvre.
      </p>

      <h2>Durées de conservation</h2>
      <p>
        Les demandes de contact sont conservées pendant leur traitement, puis au plus trois ans après le dernier échange,
        sauf obligation légale ou nécessité probatoire. Les données de newsletter sont conservées jusqu’au désabonnement.
        Les journaux techniques sont conservés pendant une durée proportionnée aux besoins de sécurité. Les durées relatives
        aux traceurs sont précisées, lorsqu’elles sont connues, dans la politique de cookies et par les services concernés.
      </p>

      <h2>Vos droits</h2>
      <p>
        Dans les conditions prévues par le RGPD, vous pouvez demander l’accès, la rectification, l’effacement et la
        portabilité de vos données, la limitation du traitement, ou vous opposer à celui-ci. Vous pouvez retirer votre
        consentement à tout moment pour l’avenir. Exercez ces droits via le formulaire de contact en précisant votre demande.
        Un justificatif d’identité ne sera demandé qu’en cas de doute raisonnable sur votre identité.
      </p>
      <p>Vous pouvez également introduire une réclamation auprès de la CNIL.</p>

      <h2>Mise à jour</h2>
      <p>Cette politique peut être adaptée aux évolutions du site, de ses prestataires ou de la réglementation.</p>
    </LegalPage>
  );
}
