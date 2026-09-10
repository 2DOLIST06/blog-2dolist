import type { Category } from '@/types/content';

export interface CategoryEditorialCopy {
  slug: string;
  path: string;
  h1: string;
  excerpt: string;
  contentHtml: string;
  metaTitle: string;
  metaDescription: string;
}

const categoryCopy = (
  slug: string,
  path: string,
  h1: string,
  excerpt: string,
  details: string
): CategoryEditorialCopy => ({
  slug,
  path,
  h1,
  excerpt,
  contentHtml: `<h2>Bien préparer votre expérience</h2><p>${details}</p><p>Retrouvez aussi nos articles pour comparer les formules, choisir un lieu de pratique et connaître les points à vérifier avant de réserver.</p>`,
  metaTitle: `${h1} : guides et conseils | Blog 2Dolist`,
  metaDescription: excerpt
});

/**
 * Editorial defaults for the historical WordPress categories. These values are
 * deliberately used only when the API leaves the corresponding field empty.
 */
export const CATEGORY_EDITORIAL_COPY: CategoryEditorialCopy[] = [
  categoryCopy('avion', '/category/aerien/avion/', 'Vol en avion', 'Guides sur les baptêmes de l’air, vols touristiques, vols d’initiation, pilotage avion, destinations et conseils pratiques.', 'Un vol en avion peut prendre la forme d’un baptême de l’air, d’un survol touristique ou d’une initiation au pilotage. Nos guides expliquent le déroulement de ces expériences, les conditions d’accès et les bonnes questions à poser pour sélectionner une destination et un appareil adaptés.'),
  categoryCopy('helicoptere', '/category/aerien/helicoptere/', 'Vol en hélicoptère', 'Guides sur les baptêmes en hélicoptère, survols touristiques, vols privés, idées cadeaux et lieux de décollage.', 'Du premier baptême au vol privé, découvrez comment se déroule un survol en hélicoptère, comment choisir son point de départ et à quoi s’attendre le jour du vol. Les conseils abordent également le confort, la météo et les formules à offrir.'),
  categoryCopy('ulm', '/category/aerien/ulm/', 'Vol en ULM', 'Guides sur les différentes classes d’ULM, multiaxe, pendulaire, autogire, paramoteur, déroulement et sensations.', 'Multiaxe, pendulaire, autogire ou paramoteur : les ULM offrent des façons très différentes de découvrir le ciel. Nos contenus vous aident à comprendre les appareils, les sensations en vol, les consignes et les critères utiles pour choisir une première expérience.'),
  categoryCopy('parachutisme', '/category/aerien/parachutisme/', 'Saut en parachute', 'Guides sur le saut en tandem, la chute libre, les centres de saut, les conditions météo, la préparation et les idées cadeaux.', 'Le saut en tandem permet de découvrir la chute libre accompagné par un moniteur. Informez-vous sur les étapes de la journée, l’équipement, les restrictions éventuelles, la météo et le choix d’un centre avant de programmer ou d’offrir un saut.'),
  categoryCopy('parapente', '/category/aerien/parapente/', 'Parapente', 'Guides sur les baptêmes en parapente, vols montagne, vols thermiques, biplace, conditions météo et lieux de pratique.', 'Un baptême en parapente biplace dépend du relief, de l’aérologie et du type de vol choisi. Retrouvez des repères sur les vols découverte ou thermiques, la tenue à prévoir, les reports météo et les principaux sites de pratique.'),
  categoryCopy('montgolfiere', '/category/aerien/montgolfiere/', 'Vol en montgolfière', 'Guides sur les baptêmes en montgolfière, vols au lever ou coucher du soleil, déroulement, météo et régions de vol.', 'La montgolfière se pratique généralement tôt le matin ou en fin de journée, lorsque l’air est stable. Nos guides présentent la préparation du ballon, le vol, l’atterrissage, les contraintes météo et les régions à découvrir depuis la nacelle.'),
  categoryCopy('planeur', '/category/aerien/planeur/', 'Vol en planeur', 'Guides sur les vols en planeur, vols d’initiation, découverte du vol sans moteur, aérologie et clubs.', 'Silencieux et sans moteur, le planeur utilise les mouvements de l’air pour prolonger son vol. Découvrez le rôle de l’aérologie, le déroulement d’un vol d’initiation ainsi que les éléments à considérer pour choisir un club et une formule.'),
  categoryCopy('aquatique', '/category/aquatique/', 'Activités aquatiques', 'Guides sur les loisirs aquatiques, idées de sorties, préparation et choix d’activités.', 'Sur l’eau ou sous la surface, chaque loisir demande une préparation adaptée. Nos articles donnent des idées de sorties et des conseils pour tenir compte du niveau des participants, de l’équipement, de la saison et des règles de sécurité.'),
  categoryCopy('montagne', '/category/montagne/', 'Activités montagne', 'Guides sur les activités de montagne, idées de sorties, sécurité, préparation et lieux de pratique.', 'La montagne se découvre toute l’année à travers des activités accessibles ou plus sportives. Préparez votre sortie en tenant compte du terrain, de la météo, du matériel, de l’encadrement et du niveau de chaque participant.'),
  categoryCopy('pilotage', '/category/pilotage/', 'Pilotage', 'Guides sur les stages de pilotage, pilotage automobile, sensations, circuits et conseils pratiques.', 'Un stage de pilotage permet de prendre le volant sur circuit et de découvrir une voiture sportive avec un encadrement professionnel. Comparez les circuits, le nombre de tours, les véhicules et les conditions requises avant de choisir une formule.'),
  categoryCopy('idees-cadeaux', '/category/idees-cadeaux/', 'Idées cadeaux activités', 'Guides pour offrir une expérience, choisir un bon cadeau, trouver une activité originale selon la saison, le lieu et le profil de la personne.', 'Offrir une activité permet de créer un souvenir plutôt que d’ajouter un objet. Nos sélections aident à trouver une expérience adaptée aux envies du bénéficiaire, à sa localisation, à la saison et au budget, tout en vérifiant la durée de validité du bon cadeau.')
];

const normalizePath = (path?: string) => path?.replace(/\/+$/, '').toLowerCase();

export const getCategoryEditorialCopy = (category: Pick<Category, 'slug' | 'path'>) =>
  CATEGORY_EDITORIAL_COPY.find(
    (copy) => copy.slug === category.slug || (category.path && normalizePath(copy.path) === normalizePath(category.path))
  );

const withEditorialDefaults = (category: Category): Category => {
  const copy = getCategoryEditorialCopy(category);
  if (!copy) return category;

  return {
    ...category,
    path: category.path?.trim() || copy.path,
    h1: category.h1?.trim() || copy.h1,
    excerpt: category.excerpt?.trim() || copy.excerpt,
    description:
      category.excerpt?.trim() ||
      (category.description?.trim() !== 'Découvrez tous les articles de cette catégorie.'
        ? category.description?.trim()
        : '') ||
      copy.excerpt,
    contentHtml: category.contentHtml?.trim() || copy.contentHtml,
    metaTitle: category.metaTitle?.trim() || copy.metaTitle,
    metaDescription: category.metaDescription?.trim() || copy.metaDescription
  };
};

export const withConfiguredShortCategoryCopy = withEditorialDefaults;
export const withConfiguredLongCategoryCopy = withEditorialDefaults;
