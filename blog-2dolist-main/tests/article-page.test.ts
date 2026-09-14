import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractHeadingsFromHtml } from '../lib/content/headings.ts';
import { sanitizeArticleHtml } from '../lib/content/article-html.ts';

const articleSource = readFileSync(new URL('../components/blog/ArticlePageView.tsx', import.meta.url), 'utf8');
const metadataSource = readFileSync(new URL('../lib/seo/post-metadata.ts', import.meta.url), 'utf8');
const catchAllPageSource = readFileSync(new URL('../app/[...path]/page.tsx', import.meta.url), 'utf8');
const legacyArticlePageSource = readFileSync(new URL('../app/blog/[slug]/page.tsx', import.meta.url), 'utf8');

test('nettoie le HTML article tout en conservant son contenu sémantique', () => {
  const input = '<p><br></p><div><br /></div><p style="--tw-space-y-reverse: 0"><span style="font-size: 1rem;">Texte&nbsp;<strong>fort</strong></span></p><img src="x.jpg" alt="X" width="961" height="640" style="width: 961px; height: auto;"><ul><li>Lien <a href="/test">test</a></li></ul>';
  const output = sanitizeArticleHtml(input);

  assert.doesNotMatch(output, /--tw-|<span|&nbsp;|<p><br|<div><br|<img[^>]+style=/i);
  assert.match(output, /<p>Texte <strong>fort<\/strong><\/p>/);
  assert.match(output, /<img src="x.jpg" alt="X" width="961" height="640">/);
  assert.match(output, /<ul><li>Lien <a href="\/test">test<\/a><\/li><\/ul>/);
});

test('recalcule des IDs uniques depuis les textes H2/H3 et aligne le sommaire', () => {
  const output = sanitizeArticleHtml('<h2 id="ancienne-faute">Équipement requis</h2><h3>À savoir</h3><h2>Équipement requis</h2>');
  assert.match(output, /<h2 id="equipement-requis">/);
  assert.match(output, /<h3 id="a-savoir">/);
  assert.match(output, /<h2 id="equipement-requis-2">/);
  assert.deepEqual(extractHeadingsFromHtml(output).map(({ id }) => id), ['equipement-requis', 'a-savoir', 'equipement-requis-2']);
});

test('le renderer article garantit un H1 éditorial et les trois JSON-LD attendus', () => {
  assert.match(articleSource, /post\.h1 \|\| post\.title/);
  assert.equal((articleSource.match(/<h1\b/g) ?? []).length, 1);
  assert.match(articleSource, /blogPostingJsonLd/);
  assert.match(articleSource, /breadcrumbJsonLd/);
  assert.match(articleSource, /post\.faqJson\?\.length \? faqPageJsonLd/);
  assert.match(articleSource, /post\.coverImageAlt \|\| articleH1/);
});

test('affiche les raccourcis de modification sur les articles et rubriques pour les admins', () => {
  assert.match(articleSource, /PublicEditButton/);
  assert.match(articleSource, /admin\/posts\/\$\{post\.id\}\/edit/);
  assert.match(catchAllPageSource, /hasAdminSession\(\)/);
  assert.match(catchAllPageSource, /admin\/categories\/\$\{category\.id\}/);
  assert.match(legacyArticlePageSource, /hasAdminSession\(\)/);
});

test('les métadonnées article omettent keywords, normalisent le canonical et bornent modifiedTime', () => {
  assert.doesNotMatch(metadataSource, /keywords\s*:/);
  assert.match(metadataSource, /withTrailingSlash\(post\.canonicalUrl/);
  assert.match(metadataSource, /modifiedTime: getValidModifiedDate/);
});
