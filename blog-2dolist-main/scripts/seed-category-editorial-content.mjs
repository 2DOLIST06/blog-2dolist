#!/usr/bin/env node

const entries = [
  ['avion', 'Vol en avion', 'Guides sur les baptêmes de l’air, vols touristiques, vols d’initiation, pilotage avion, destinations et conseils pratiques.'],
  ['helicoptere', 'Vol en hélicoptère', 'Guides sur les baptêmes en hélicoptère, survols touristiques, vols privés, idées cadeaux et lieux de décollage.'],
  ['ulm', 'Vol en ULM', 'Guides sur les différentes classes d’ULM, multiaxe, pendulaire, autogire, paramoteur, déroulement et sensations.'],
  ['parachutisme', 'Saut en parachute', 'Guides sur le saut en tandem, la chute libre, les centres de saut, les conditions météo, la préparation et les idées cadeaux.'],
  ['parapente', 'Parapente', 'Guides sur les baptêmes en parapente, vols montagne, vols thermiques, biplace, conditions météo et lieux de pratique.'],
  ['montgolfiere', 'Vol en montgolfière', 'Guides sur les baptêmes en montgolfière, vols au lever ou coucher du soleil, déroulement, météo et régions de vol.'],
  ['planeur', 'Vol en planeur', 'Guides sur les vols en planeur, vols d’initiation, découverte du vol sans moteur, aérologie et clubs.'],
  ['aquatique', 'Activités aquatiques', 'Guides sur les loisirs aquatiques, idées de sorties, préparation et choix d’activités.'],
  ['montagne', 'Activités montagne', 'Guides sur les activités de montagne, idées de sorties, sécurité, préparation et lieux de pratique.'],
  ['pilotage', 'Pilotage', 'Guides sur les stages de pilotage, pilotage automobile, sensations, circuits et conseils pratiques.'],
  ['idees-cadeaux', 'Idées cadeaux activités', 'Guides pour offrir une expérience, choisir un bon cadeau, trouver une activité originale selon la saison, le lieu et le profil de la personne.']
].map(([slug, h1, excerpt]) => ({
  slug,
  excerpt,
  contentHtml: `<h2>Bien préparer votre expérience</h2><p>${excerpt} Retrouvez nos conseils pour comparer les formules, choisir un lieu de pratique et connaître les points à vérifier avant de réserver.</p>`,
  metaTitle: `${h1} : guides et conseils | Blog 2Dolist`,
  metaDescription: excerpt
}));

const write = process.argv.includes('--write');
const baseUrl = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const token = process.env.ADMIN_API_TOKEN;

if (!baseUrl) {
  console.error('Définissez API_BASE_URL (ou NEXT_PUBLIC_API_URL).');
  process.exit(1);
}
if (write && !token) {
  console.error('ADMIN_API_TOKEN est requis avec --write.');
  process.exit(1);
}

const headers = token ? { Authorization: `Bearer ${token}` } : {};
const response = await fetch(`${baseUrl}/api/categories?locale=fr`, { headers });
if (!response.ok) throw new Error(`Lecture des catégories impossible (${response.status}).`);
const json = await response.json();
const categories = Array.isArray(json) ? json : json.data?.docs || json.data?.items || json.data || json.docs || json.items || json.categories || [];

for (const seed of entries) {
  const category = categories.find((item) => item.slug === seed.slug);
  if (!category) {
    console.warn(`[absente] ${seed.slug}`);
    continue;
  }
  const patch = Object.fromEntries(
    Object.entries(seed).filter(([key, value]) => key !== 'slug' && value && !category[key]?.trim?.())
  );
  if (Object.keys(patch).length === 0) {
    console.log(`[inchangée] ${seed.slug}`);
    continue;
  }
  console.log(`[${write ? 'mise à jour' : 'simulation'}] ${seed.slug}: ${Object.keys(patch).join(', ')}`);
  if (write) {
    const update = await fetch(`${baseUrl}/api/categories/${category.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    if (!update.ok) throw new Error(`Mise à jour de ${seed.slug} impossible (${update.status}).`);
  }
}

if (!write) console.log('Simulation terminée. Relancez avec --write et ADMIN_API_TOKEN pour appliquer.');
