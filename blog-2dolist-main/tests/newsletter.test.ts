import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeNewsletterPreferences } from '../lib/newsletter-normalization.ts';

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('le client newsletter cible la vraie origine API et les quatre endpoints contractuels', async () => {
  const source = await read('lib/newsletter.ts');
  assert.match(source, /buildPublicApiUrl/);
  assert.match(source, /'\/api\/newsletter\/subscribe'/);
  assert.match(source, /`\/api\/newsletter\/preferences\?\$\{/);
  assert.match(source, /'\/api\/newsletter\/unsubscribe'/);
  assert.doesNotMatch(source, /fetch\(['"]\/api\/newsletter/);
});

test('l’inscription footer et article transmet le consentement versionné et le contexte structuré', async () => {
  const cta = await read('components/blog/NewsletterCta.tsx');
  const footer = await read('components/layout/Footer.tsx');
  const article = await read('components/blog/ArticlePageView.tsx');
  assert.match(footer, /NewsletterCta source="footer"/);
  assert.match(article, /NewsletterCta source="article"/);
  assert.match(article, /interest=\{post\.newsletterInterest\}/);
  assert.match(article, /region=\{post\.newsletterRegion\}/);
  assert.match(cta, /consent: true, consentTextVersion: 'v1'/);
  assert.match(cta, /\.\.\.\(interest \? \{ interest \} : \{\}\)/);
  assert.match(cta, /\.\.\.\(region \? \{ region \} : \{\}\)/);
  assert.match(cta, /type="checkbox" required checked=\{consent\}/);
});

test('le centre charge une fois par token et couvre activités, régions, fréquence et sauvegarde', async () => {
  const source = await read('components/newsletter/NewsletterPreferences.tsx');
  assert.match(source, /getNewsletterPreferences\(token\)/);
  assert.match(source, /\}, \[token\]\);/);
  assert.match(source, /NEWSLETTER_INTERESTS\.map/);
  assert.match(source, /getNewsletterRegions\(\)/);
  assert.match(source, /interests: draft\.interests/);
  assert.match(source, /regions: draft\.regions\.map\(\(region\) => region\.id\)/);
  assert.match(source, /frequency: draft\.frequency/);
  assert.match(source, /setPreferences\(saved\); setDraft\(saved\)/);
});

test('le token invalide a un message clair et action=unsubscribe attend un clic explicite', async () => {
  const page = await read('app/newsletter/preferences/page.tsx');
  const center = await read('components/newsletter/NewsletterPreferences.tsx');
  assert.match(page, /Le token de préférences est absent/);
  assert.match(center, /Lien de préférences invalide/);
  assert.match(center, /onClick=\{unsubscribe\}/);
  const loadEffect = center.match(/useEffect\(\(\) => \{([^]*?)\n  \}, \[token\]\);/)?.[1] ?? '';
  assert.doesNotMatch(loadEffect, /unsubscribeFromNewsletter/);
});

test('aucun proxy newsletter Next.js ne subsiste', async () => {
  await assert.rejects(read('app/api/newsletter/route.ts'));
});

test('les collections vides restent des tableaux utilisables au rendu', () => {
  const preferences = normalizeNewsletterPreferences({
    email: 'pilote@example.com', interests: [], contentTypes: [], regions: [], subscribed: false
  });

  assert.deepEqual(preferences.interests, []);
  assert.deepEqual(preferences.contentTypes, []);
  assert.deepEqual(preferences.regions, []);
  assert.equal(preferences.subscribed, false);
  assert.equal(preferences.interests.includes('airplane'), false);
  assert.doesNotThrow(() => preferences.regions.map((region) => region.id));
});

test('une collection absente est normalisée avant les includes du centre', () => {
  const preferences = normalizeNewsletterPreferences({
    email: 'pilote@example.com', interests: null, contentTypes: ['new_articles'], frequency: 'monthly'
  });

  assert.deepEqual(preferences.interests, []);
  assert.deepEqual(preferences.regions, []);
  assert.equal(preferences.interests.includes('airplane'), false);
  assert.equal(preferences.contentTypes.includes('new_articles'), true);
});

test('le premier rendu attend les préférences normalisées sans déréférencer le brouillon', async () => {
  const source = await read('components/newsletter/NewsletterPreferences.tsx');
  assert.match(source, /if \(loading\) return/);
  assert.match(source, /if \(!draft \|\| !preferences\) return null/);
  assert.match(source, /getNewsletterPreferences\(token\)/);
});

test('les anciens noms du contrat API alimentent les sélections après chargement', () => {
  const preferences = normalizeNewsletterPreferences({
    categories: ['airplane'],
    selectedRegions: [{ id: 'occitanie', name: 'Occitanie' }]
  });

  assert.equal(preferences.interests.includes('airplane'), true);
  assert.deepEqual(preferences.regions, [{ id: 'occitanie', name: 'Occitanie' }]);
});
