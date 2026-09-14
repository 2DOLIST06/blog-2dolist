export type SitemapEntryLike = { url?: string | null };

export type IndexNowBatchResult = {
  batch: number;
  urlCount: number;
  status: number;
};

export const isValidIndexNowKey = (key: string) => /^[A-Za-z0-9-]{8,128}$/.test(key);

export const getVerificationContent = (configuredKey: string | null, filename: string) =>
  configuredKey && filename === `${configuredKey}.txt` ? configuredKey : null;

export function deduplicateSitemapUrls(entries: SitemapEntryLike[], allowedOrigin: string) {
  const urls = new Set<string>();

  for (const entry of entries) {
    if (typeof entry.url !== 'string') continue;
    let parsed: URL;
    try {
      parsed = new URL(entry.url);
    } catch {
      continue;
    }
    if (parsed.origin !== allowedOrigin || !['http:', 'https:'].includes(parsed.protocol)) continue;
    parsed.hash = '';
    urls.add(parsed.toString());
  }

  return [...urls];
}

export const filterAllowedUrls = (requested: unknown[], allowedUrls: Set<string>) =>
  [...new Set(requested.filter((url): url is string => typeof url === 'string' && allowedUrls.has(url)))];

export async function processIndexNowBatches(
  urls: string[],
  batchSize: number,
  submitBatch: (batch: string[], alreadySubmittedUrls: string[], batchNumber: number) => Promise<number>
) {
  const submittedUrls: string[] = [];
  const batches: IndexNowBatchResult[] = [];
  for (let offset = 0; offset < urls.length; offset += batchSize) {
    const batch = urls.slice(offset, offset + batchSize);
    const batchNumber = Math.floor(offset / batchSize) + 1;
    const status = await submitBatch(batch, submittedUrls, batchNumber);
    submittedUrls.push(...batch);
    batches.push({ batch: batchNumber, urlCount: batch.length, status });
  }
  return { submittedUrls, batches };
}
