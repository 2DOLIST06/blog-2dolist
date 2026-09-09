const requestedPaths = process.argv.slice(2);
const auditAll = requestedPaths.includes('--all');
const explicitPaths = requestedPaths.filter((path) => path !== '--all');
const apiBaseUrl = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const frontendBaseUrl = (process.env.FRONTEND_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.2dolist.fr').replace(/\/$/, '');
const productionBaseUrl = 'https://blog.2dolist.fr';

if (!apiBaseUrl || (!auditAll && explicitPaths.length === 0)) {
  console.error('Usage: API_BASE_URL=https://api.example.com npm run seo:verify -- [--all | /path/ ...]');
  process.exit(2);
}

const unwrap = (payload, resource) => payload?.data?.[resource] ?? payload?.data ?? payload?.[resource];
const decode = (value = '') => value
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#x27;', "'")
  .replaceAll('&#39;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');
const stripHtml = (value = '') => decode(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const tagContent = (html, expression) => decode(html.match(expression)?.[1]?.trim() || '');
const attribute = (html, tagExpression, name) => {
  const tag = html.match(tagExpression)?.[0] || '';
  return decode(tag.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))?.[1]?.trim() || '');
};
const asArray = (payload, resource) => {
  const value = unwrap(payload, resource);
  if (Array.isArray(value)) return value;
  for (const key of ['docs', 'items', resource]) if (Array.isArray(value?.[key])) return value[key];
  return [];
};
const normalizePath = (path) => path.startsWith('/') ? path : `/${path}`;
const absoluteUrl = (src, pageUrl) => new URL(src, pageUrl).href;
const markerChecks = [
  ['wp:comments', /wp:comments/i],
  ['wp-content', /\/wp-content\/uploads\//i],
  ['/fr/', /(?:href|src)=["'][^"']*\/fr\//i],
  ['/articles/', /(?:href|src)=["'][^"']*\/articles\//i],
  ['lorem ipsum', /lorem ipsum/i],
  ['Discover amazing places', /Discover amazing places/i],
  ['Booking', /\bBooking\b/i],
  ['Directory & Listing WordPress Theme', /Directory (?:&|&amp;) Listing WordPress Theme/i]
];

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`);
  return response.json();
}

async function getRecord(path, isCategory) {
  const resource = isCategory ? 'category' : 'post';
  const endpoint = isCategory ? '/api/categories/by-path' : '/api/posts/by-path';
  const query = new URLSearchParams({ path, ...(!isCategory && { locale: 'fr' }) });
  return unwrap(await fetchJson(`${apiBaseUrl}${endpoint}?${query}`), resource);
}

async function getAllRecords(resource) {
  const endpoint = resource === 'posts' ? '/api/posts?locale=fr&limit=100' : '/api/categories?limit=100';
  return asArray(await fetchJson(`${apiBaseUrl}${endpoint}`), resource);
}

const report = {
  articles: 0,
  categories: 0,
  httpErrors: [],
  seoErrors: [],
  contentErrors: [],
  imageErrors: [],
  occurrences: [],
  sitemapErrors: [],
  robotsErrors: []
};

function error(bucket, path, message) {
  report[bucket].push(`${path}: ${message}`);
}

async function auditPath(path, suppliedRecord) {
  const isCategory = path.startsWith('/category/');
  if (isCategory) report.categories += 1;
  else report.articles += 1;

  try {
    const record = suppliedRecord || await getRecord(path, isCategory);
    if (!record) throw new Error('enregistrement API absent');
    const pageUrl = `${frontendBaseUrl}${path}`;
    const response = await fetch(pageUrl, { redirect: 'manual' });
    if (response.status !== 200) {
      const location = response.headers.get('location');
      error('httpErrors', path, `HTTP ${response.status}${location ? ` -> ${location}` : ''}`);
      return;
    }
    const html = await response.text();
    const expectedTitle = record.metaTitle?.trim() || (isCategory ? record.name || record.title : record.title);
    const expectedDescription = record.metaDescription?.trim() || record.excerpt || record.description;
    const expectedCanonical = record.canonicalUrl?.trim() || `${productionBaseUrl}${normalizePath(record.path || path)}`;
    const actualTitle = tagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const actualDescription = attribute(html, /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i, 'content');
    const actualCanonical = attribute(html, /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, 'href');
    const robots = attribute(html, /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i, 'content').toLowerCase();

    if (!actualTitle || (expectedTitle && actualTitle !== expectedTitle)) error('seoErrors', path, `title attendu "${expectedTitle}", reçu "${actualTitle}"`);
    if (!actualDescription || (expectedDescription && actualDescription !== expectedDescription)) error('seoErrors', path, `description attendue "${expectedDescription}", reçue "${actualDescription}"`);
    if (!actualCanonical || actualCanonical !== expectedCanonical) error('seoErrors', path, `canonical attendu "${expectedCanonical}", reçu "${actualCanonical}"`);
    if (record.isIndexable !== false && robots.includes('noindex')) error('seoErrors', path, `noindex involontaire (${robots})`);
    if (record.isIndexable === false && !robots.includes('noindex')) error('seoErrors', path, 'noindex absent pour une ressource non indexable');
    if (!/<h1\b[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i.test(html)) error('contentErrors', path, 'H1 absent ou vide');
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
    if (stripHtml(main).length < 100) error('contentErrors', path, 'contenu principal vide ou trop court');
    if (!isCategory && stripHtml(record.contentHtml || record.content || '').length > 0 && stripHtml(main).length < 300) error('contentErrors', path, 'contenu article non affiché');
    if (!isCategory && record.faqJson && !/<(?:section|div)[^>]*(?:faq|questions)/i.test(html)) error('contentErrors', path, 'FAQ API non détectée dans le HTML');

    for (const [label, expression] of markerChecks) if (expression.test(html)) report.occurrences.push(`${path}: ${label}`);
    if (path.includes('/fr/') || path.includes('/articles/')) error('httpErrors', path, 'path interdit audité');

    const imageSources = [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
    for (const src of [...new Set(imageSources)]) {
      const imageUrl = absoluteUrl(decode(src), pageUrl);
      try {
        const imageResponse = await fetch(imageUrl, { method: 'HEAD', redirect: 'follow' });
        if (!imageResponse.ok) error('imageErrors', path, `${imageUrl} -> HTTP ${imageResponse.status}`);
      } catch (imageError) {
        error('imageErrors', path, `${imageUrl} -> ${imageError instanceof Error ? imageError.message : imageError}`);
      }
    }
    console.log(`PASS HTTP ${path} (${imageSources.length} image(s))`);
  } catch (auditError) {
    error('httpErrors', path, auditError instanceof Error ? auditError.message : String(auditError));
    console.error(`FAIL ${path}: ${auditError instanceof Error ? auditError.message : auditError}`);
  }
}

async function auditSitemap(expectedRecords) {
  const path = '/sitemap.xml';
  try {
    const response = await fetch(`${frontendBaseUrl}${path}`, { redirect: 'manual' });
    if (response.status !== 200) return error('sitemapErrors', path, `HTTP ${response.status}`);
    const xml = await response.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
    for (const forbidden of ['/fr/', '/articles/', '/categories/']) if (urls.some((url) => new URL(url).pathname.includes(forbidden))) error('sitemapErrors', path, `URL interdite ${forbidden}`);
    for (const url of urls) if (!url.startsWith(`${productionBaseUrl}/`)) error('sitemapErrors', path, `domaine incorrect: ${url}`);
    for (const record of expectedRecords.filter((item) => item.isIndexable !== false && item.path)) {
      const expected = record.canonicalUrl?.trim() || `${productionBaseUrl}${normalizePath(record.path)}`;
      if (!urls.includes(expected)) error('sitemapErrors', path, `URL indexable absente: ${expected}`);
    }
    for (const record of expectedRecords.filter((item) => item.isIndexable === false && item.path)) {
      const forbidden = record.canonicalUrl?.trim() || `${productionBaseUrl}${normalizePath(record.path)}`;
      if (urls.includes(forbidden)) error('sitemapErrors', path, `URL noindex présente: ${forbidden}`);
    }
  } catch (sitemapError) {
    error('sitemapErrors', path, sitemapError instanceof Error ? sitemapError.message : String(sitemapError));
  }
}

async function auditRobots() {
  const path = '/robots.txt';
  try {
    const response = await fetch(`${frontendBaseUrl}${path}`, { redirect: 'manual' });
    if (response.status !== 200) return error('robotsErrors', path, `HTTP ${response.status}`);
    const body = await response.text();
    if (!/^Sitemap:\s*https:\/\/blog\.2dolist\.fr\/sitemap\.xml\s*$/im.test(body)) error('robotsErrors', path, 'sitemap de production absent');
    for (const publicPath of ['/category/', '/202']) {
      if (new RegExp(`^Disallow:\\s*${publicPath.replace('/', '\\/')}`, 'im').test(body)) error('robotsErrors', path, `pages publiques bloquées par ${publicPath}`);
    }
  } catch (robotsError) {
    error('robotsErrors', path, robotsError instanceof Error ? robotsError.message : String(robotsError));
  }
}

let records = [];
if (auditAll) {
  try {
    const [posts, categories] = await Promise.all([getAllRecords('posts'), getAllRecords('categories')]);
    const publishedPosts = posts.filter((post) => (!post.status || post.status.toUpperCase() === 'PUBLISHED') && post.isActive !== false);
    const activeCategories = categories.filter((category) => category.isActive !== false);
    records = [...publishedPosts, ...activeCategories];
    for (const post of publishedPosts.filter((item) => item.path)) await auditPath(normalizePath(post.path), post);
    for (const category of activeCategories.filter((item) => item.path)) await auditPath(normalizePath(category.path), category);
  } catch (collectionError) {
    error('httpErrors', 'API collections', collectionError instanceof Error ? collectionError.message : String(collectionError));
  }
}
for (const path of explicitPaths) await auditPath(normalizePath(path));
await Promise.all([auditSitemap(records), auditRobots()]);

console.log('\n=== SEO AUDIT SUMMARY ===');
console.log(`Articles testés: ${report.articles}`);
console.log(`Catégories testées: ${report.categories}`);
for (const [label, key] of [
  ['Erreurs HTTP', 'httpErrors'],
  ['Erreurs SEO', 'seoErrors'],
  ['Erreurs contenu', 'contentErrors'],
  ['Erreurs images', 'imageErrors'],
  ['Occurrences signalées', 'occurrences'],
  ['Erreurs sitemap', 'sitemapErrors'],
  ['Erreurs robots', 'robotsErrors']
]) {
  console.log(`${label}: ${report[key].length}`);
  for (const detail of report[key]) console.log(`  - ${detail}`);
}

if (Object.values(report).some((value) => Array.isArray(value) && value.length > 0)) process.exit(1);
