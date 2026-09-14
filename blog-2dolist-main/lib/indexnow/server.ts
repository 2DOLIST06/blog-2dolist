import 'server-only';

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getLocalizedSitemap } from '@/lib/seo/sitemap';
import { locales } from '@/lib/i18n/routing';
import { siteConfig } from '@/lib/constants';
import { calculateIndexNowPages, deduplicateSitemapEntries, isValidIndexNowKey, type IndexNowHistory, type IndexNowPage } from './core';

const INDEXNOW_ENDPOINT = 'https://www.bing.com/indexnow';
const MAX_URLS_PER_BATCH = 10_000;
const DEFAULT_STORE_PATH = '.data/indexnow-submissions.json';

type Store = { submissions: IndexNowHistory };
let writeQueue = Promise.resolve();

export const getIndexNowKey = () => {
  const key = (process.env.INDEXNOW_KEY || process.env.BING_INDEXNOW_KEY || '').trim();
  return isValidIndexNowKey(key) ? key : null;
};

const getStorePath = () => path.resolve(process.env.INDEXNOW_STORE_PATH?.trim() || DEFAULT_STORE_PATH);

export async function readIndexNowStore(): Promise<Store> {
  try {
    const parsed = JSON.parse(await readFile(getStorePath(), 'utf8')) as Partial<Store>;
    return { submissions: parsed.submissions && typeof parsed.submissions === 'object' ? parsed.submissions : {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { submissions: {} };
    throw new Error('Impossible de lire l’historique IndexNow.');
  }
}

async function mergeSuccessfulSubmissions(pages: IndexNowPage[], submittedAt: string) {
  writeQueue = writeQueue.then(async () => {
    const store = await readIndexNowStore();
    for (const page of pages) store.submissions[page.url] = { submittedAt, lastModified: page.lastModified };
    const storePath = getStorePath();
    await mkdir(path.dirname(storePath), { recursive: true });
    const temporaryPath = `${storePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    await rename(temporaryPath, storePath);
  });
  await writeQueue;
}

export async function getIndexNowPages() {
  const origin = new URL(siteConfig.baseUrl).origin;
  const sitemapEntries = (await Promise.all(locales.map(getLocalizedSitemap))).flat();
  const entries = deduplicateSitemapEntries(sitemapEntries, origin);
  const store = await readIndexNowStore();
  return calculateIndexNowPages(entries, store.submissions);
}

async function verifyKeyFile(key: string, keyLocation: string) {
  let response: Response;
  try {
    response = await fetch(keyLocation, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new Error('Le fichier public de vérification IndexNow est inaccessible.');
  }
  if (!response.ok || (await response.text()) !== key) {
    throw new Error('Le fichier public de vérification IndexNow est absent ou invalide.');
  }
}

export class IndexNowSubmissionError extends Error {
  constructor(message: string, public readonly status: number, public readonly submittedUrls: string[]) {
    super(message);
  }
}

export async function submitIndexNowPages(pages: IndexNowPage[]) {
  const key = getIndexNowKey();
  if (!key) throw new IndexNowSubmissionError('La clé IndexNow serveur est absente ou invalide.', 503, []);
  if (!pages.length) throw new IndexNowSubmissionError('Aucune URL autorisée à envoyer.', 400, []);

  const configuredUrl = new URL(siteConfig.baseUrl);
  const keyLocation = new URL(`/${key}.txt`, configuredUrl).toString();
  await verifyKeyFile(key, keyLocation);

  const submittedUrls: string[] = [];
  for (let offset = 0; offset < pages.length; offset += MAX_URLS_PER_BATCH) {
    const batch = pages.slice(offset, offset + MAX_URLS_PER_BATCH);
    let response: Response;
    try {
      response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host: configuredUrl.host, key, keyLocation, urlList: batch.map((page) => page.url) }),
        signal: AbortSignal.timeout(20_000)
      });
    } catch {
      throw new IndexNowSubmissionError('IndexNow est actuellement inaccessible.', 502, submittedUrls);
    }
    if (!response.ok) {
      throw new IndexNowSubmissionError(`IndexNow a refusé un lot (statut HTTP ${response.status}).`, 502, submittedUrls);
    }
    const submittedAt = new Date().toISOString();
    await mergeSuccessfulSubmissions(batch, submittedAt);
    submittedUrls.push(...batch.map((page) => page.url));
  }
  return submittedUrls;
}
