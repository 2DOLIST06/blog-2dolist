const paths = process.argv.slice(2);
const apiBaseUrl = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const frontendBaseUrl = (process.env.FRONTEND_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.2dolist.fr').replace(/\/$/, '');

if (!apiBaseUrl || paths.length === 0) {
  console.error('Usage: API_BASE_URL=https://api.example.com npm run seo:verify -- /path/ [/other-path/]');
  process.exit(2);
}

const unwrap = (payload, resource) => payload?.data?.[resource] ?? payload?.data ?? payload?.[resource];
const content = (html, expression, label) => {
  const match = html.match(expression);
  if (!match) throw new Error(`${label} absent du HTML`);
  return match[1].trim();
};
const attribute = (html, tagExpression, attributeName, label) => {
  const tag = html.match(tagExpression)?.[0];
  if (!tag) throw new Error(`${label} absent du HTML`);
  return content(tag, new RegExp(`${attributeName}=["']([^"']*)["']`, 'i'), label);
};
const decode = (value) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#x27;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');

let failed = false;
for (const path of paths) {
  try {
    const isCategory = path.startsWith('/category/');
    const endpoint = isCategory ? '/api/categories/by-path' : '/api/posts/by-path';
    const resource = isCategory ? 'category' : 'post';
    const apiUrl = `${apiBaseUrl}${endpoint}?${new URLSearchParams({ path, ...(!isCategory && { locale: 'fr' }) })}`;
    const [apiResponse, pageResponse] = await Promise.all([
      fetch(apiUrl),
      fetch(`${frontendBaseUrl}${path}`)
    ]);
    if (!apiResponse.ok) throw new Error(`API ${apiResponse.status} (${apiUrl})`);
    if (!pageResponse.ok) throw new Error(`front ${pageResponse.status}`);

    const record = unwrap(await apiResponse.json(), resource);
    const required = isCategory
      ? ['metaTitle', 'metaDescription', 'canonicalUrl', 'isIndexable', 'path', 'name', 'excerpt']
      : ['metaTitle', 'metaDescription', 'canonicalUrl', 'isIndexable', 'path', 'title', 'excerpt'];
    const missing = required.filter((field) => !(field in (record || {})));
    if (missing.length) throw new Error(`champs API absents: ${missing.join(', ')}`);

    const html = await pageResponse.text();
    const actual = {
      title: decode(content(html, /<title[^>]*>([\s\S]*?)<\/title>/i, 'title')),
      description: decode(attribute(html, /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i, 'content', 'meta description')),
      canonical: decode(attribute(html, /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, 'href', 'canonical'))
    };
    const expected = {
      title: record.metaTitle?.trim() || (isCategory ? record.name : record.title),
      description: record.metaDescription?.trim() || record.excerpt,
      canonical: record.canonicalUrl?.trim() || `${frontendBaseUrl}${record.path}`
    };
    for (const key of Object.keys(expected)) {
      if (actual[key] !== expected[key]) throw new Error(`${key}: attendu "${expected[key]}", reçu "${actual[key]}"`);
    }
    console.log(`PASS ${path}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${path}: ${error instanceof Error ? error.message : error}`);
  }
}

if (failed) process.exit(1);
