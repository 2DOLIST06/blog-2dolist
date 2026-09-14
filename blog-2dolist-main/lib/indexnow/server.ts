import 'server-only';

import { getLocalizedSitemap } from '@/lib/seo/sitemap';
import { locales } from '@/lib/i18n/routing';
import { siteConfig } from '@/lib/constants';
import {
  deduplicateSitemapUrls,
  isValidIndexNowKey,
  processIndexNowBatches,
  type IndexNowBatchResult
} from './core';

const INDEXNOW_ENDPOINT = 'https://www.bing.com/indexnow';
const MAX_URLS_PER_BATCH = 10_000;

export const getIndexNowKey = () => {
  const key = (process.env.INDEXNOW_KEY || process.env.BING_INDEXNOW_KEY || '').trim();
  return isValidIndexNowKey(key) ? key : null;
};

export async function getIndexNowUrls() {
  const origin = new URL(siteConfig.baseUrl).origin;
  const sitemapEntries = (await Promise.all(
    locales.map((locale) => getLocalizedSitemap(locale, { cache: 'no-store' }))
  )).flat();
  return deduplicateSitemapUrls(sitemapEntries, origin);
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
  constructor(
    message: string,
    public readonly status: number,
    public readonly submittedUrls: string[],
    public readonly batches: IndexNowBatchResult[] = []
  ) {
    super(message);
  }
}

export async function submitIndexNowUrls(urls: string[]) {
  const key = getIndexNowKey();
  if (!key) throw new IndexNowSubmissionError('La clé IndexNow serveur est absente ou invalide.', 503, []);
  if (!urls.length) throw new IndexNowSubmissionError('Aucune URL autorisée à envoyer.', 400, []);

  const configuredUrl = new URL(siteConfig.baseUrl);
  const keyLocation = new URL(`/${key}.txt`, configuredUrl).toString();
  await verifyKeyFile(key, keyLocation);

  const completedBatches: IndexNowBatchResult[] = [];
  try {
    return await processIndexNowBatches(urls, MAX_URLS_PER_BATCH, async (batch, submittedUrls, batchNumber) => {
      let response: Response;
      try {
        response = await fetch(INDEXNOW_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ host: configuredUrl.host, key, keyLocation, urlList: batch }),
          cache: 'no-store',
          signal: AbortSignal.timeout(20_000)
        });
      } catch {
        throw new IndexNowSubmissionError('IndexNow est actuellement inaccessible.', 502, submittedUrls, completedBatches);
      }
      if (!response.ok) {
        throw new IndexNowSubmissionError(
          `IndexNow a refusé le lot ${batchNumber} (statut HTTP ${response.status}).`,
          502,
          submittedUrls,
          completedBatches
        );
      }
      completedBatches.push({ batch: batchNumber, urlCount: batch.length, status: response.status });
      return response.status;
    });
  } catch (error) {
    if (error instanceof IndexNowSubmissionError) throw error;
    throw new IndexNowSubmissionError('Envoi IndexNow impossible.', 502, [], completedBatches);
  }
}
