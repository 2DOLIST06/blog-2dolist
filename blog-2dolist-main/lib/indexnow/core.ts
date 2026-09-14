export type SitemapEntryLike = { url?: string | null; lastModified?: string | Date | null };

export type IndexNowHistory = Record<string, { submittedAt: string; lastModified: string | null }>;

export type IndexNowPage = {
  url: string;
  lastModified: string | null;
  submittedAt: string | null;
  needsSubmission: boolean;
  submissionReason: 'never-submitted' | 'modified' | 'unchanged';
};

export const isValidIndexNowKey = (key: string) => /^[A-Za-z0-9-]{8,128}$/.test(key);

export const getVerificationContent = (configuredKey: string | null, filename: string) =>
  configuredKey && filename === `${configuredKey}.txt` ? configuredKey : null;

const toIso = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export function deduplicateSitemapEntries(entries: SitemapEntryLike[], allowedOrigin: string) {
  const byUrl = new Map<string, { url: string; lastModified: string | null }>();

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
    const url = parsed.toString();
    const lastModified = toIso(entry.lastModified);
    const current = byUrl.get(url);
    if (!current || (lastModified && (!current.lastModified || lastModified > current.lastModified))) {
      byUrl.set(url, { url, lastModified });
    }
  }

  return [...byUrl.values()];
}

export function calculateIndexNowPages(
  entries: Array<{ url: string; lastModified: string | null }>,
  history: IndexNowHistory
): IndexNowPage[] {
  return entries.map((entry) => {
    const previous = history[entry.url];
    if (!previous) {
      return { ...entry, submittedAt: null, needsSubmission: true, submissionReason: 'never-submitted' };
    }
    const modified = Boolean(entry.lastModified && (!previous.lastModified || entry.lastModified > previous.lastModified));
    return {
      ...entry,
      submittedAt: previous.submittedAt,
      needsSubmission: modified,
      submissionReason: modified ? 'modified' : 'unchanged'
    };
  });
}

export const filterAllowedUrls = (requested: unknown[], allowedUrls: Set<string>) =>
  [...new Set(requested.filter((url): url is string => typeof url === 'string' && allowedUrls.has(url)))];

export async function processIndexNowBatches(
  pages: IndexNowPage[],
  batchSize: number,
  submitBatch: (batch: IndexNowPage[], alreadySubmittedUrls: string[]) => Promise<void>,
  saveAcceptedBatch: (batch: IndexNowPage[]) => Promise<void>
) {
  const submittedUrls: string[] = [];
  for (let offset = 0; offset < pages.length; offset += batchSize) {
    const batch = pages.slice(offset, offset + batchSize);
    await submitBatch(batch, submittedUrls);
    await saveAcceptedBatch(batch);
    submittedUrls.push(...batch.map((page) => page.url));
  }
  return submittedUrls;
}
