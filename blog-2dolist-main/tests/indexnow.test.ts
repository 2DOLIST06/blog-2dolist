import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateIndexNowPages, deduplicateSitemapEntries, filterAllowedUrls, getVerificationContent, isValidIndexNowKey, processIndexNowBatches, type IndexNowPage } from '../lib/indexnow/core.ts';
import { readIndexNowHistory, saveSuccessfulIndexNowSubmissions, type IndexNowSubmissionRecord } from '../lib/indexnow/history.ts';

test('déduplique le sitemap et conserve la modification la plus récente', () => {
  const result = deduplicateSitemapEntries([
    { url: 'https://example.invalid/article', lastModified: '2025-01-01' },
    { url: 'https://example.invalid/article', lastModified: '2025-02-01' },
    { url: 'not-an-url' },
    { url: 'https://outside.invalid/article' }
  ], 'https://example.invalid');
  assert.deepEqual(result, [{ url: 'https://example.invalid/article', lastModified: '2025-02-01T00:00:00.000Z' }]);
});

test('détecte les URL jamais envoyées, modifiées et inchangées', () => {
  const pages = calculateIndexNowPages([
    { url: 'https://example.invalid/new', lastModified: null },
    { url: 'https://example.invalid/changed', lastModified: '2025-02-01T00:00:00.000Z' },
    { url: 'https://example.invalid/same', lastModified: '2025-01-01T00:00:00.000Z' }
  ], {
    'https://example.invalid/changed': { submittedAt: '2025-01-02T00:00:00.000Z', lastModified: '2025-01-01T00:00:00.000Z' },
    'https://example.invalid/same': { submittedAt: '2025-01-02T00:00:00.000Z', lastModified: '2025-01-01T00:00:00.000Z' }
  });
  assert.deepEqual(pages.map((page) => page.submissionReason), ['never-submitted', 'modified', 'unchanged']);
});

test('filtre et déduplique les URL qui ne viennent pas du sitemap', () => {
  const allowed = new Set(['https://example.invalid/allowed']);
  assert.deepEqual(filterAllowedUrls(['https://example.invalid/allowed', 'https://evil.invalid', 'https://example.invalid/allowed'], allowed), ['https://example.invalid/allowed']);
});

test('refuse une clé absente ou un mauvais nom de fichier de vérification', () => {
  assert.equal(isValidIndexNowKey('short'), false);
  assert.equal(getVerificationContent(null, 'anything.txt'), null);
  assert.equal(getVerificationContent('fake-key-123', 'wrong.txt'), null);
  assert.equal(getVerificationContent('fake-key-123', 'fake-key-123.txt'), 'fake-key-123');
});

test('lit l’historique IndexNow depuis la base', async () => {
  const records: IndexNowSubmissionRecord[] = [{
    url: 'https://example.invalid/article',
    contentLastModifiedAt: new Date('2025-02-01T00:00:00.000Z'),
    lastSubmittedAt: new Date('2025-02-02T12:00:00.000Z')
  }];
  const history = await readIndexNowHistory({ findMany: async () => records, upsert: async () => undefined });
  assert.deepEqual(history, {
    'https://example.invalid/article': {
      lastModified: '2025-02-01T00:00:00.000Z',
      submittedAt: '2025-02-02T12:00:00.000Z'
    }
  });
});

test('crée puis met à jour une soumission IndexNow en base', async () => {
  const records = new Map<string, IndexNowSubmissionRecord>();
  const database = {
    findMany: async () => [...records.values()],
    upsert: async ({ where, create, update }: Parameters<import('../lib/indexnow/history.ts').IndexNowSubmissionDatabase['upsert']>[0]) => {
      records.set(where.url, records.has(where.url) ? { url: where.url, ...update } : create);
    }
  };
  const page = { url: 'https://example.invalid/article', lastModified: null, submittedAt: null, needsSubmission: true, submissionReason: 'never-submitted' as const };
  await saveSuccessfulIndexNowSubmissions(database, [page], new Date('2025-02-02T12:00:00.000Z'));
  await saveSuccessfulIndexNowSubmissions(database, [{ ...page, lastModified: '2025-03-01T00:00:00.000Z' }], new Date('2025-03-02T12:00:00.000Z'));
  assert.deepEqual(await readIndexNowHistory(database), {
    'https://example.invalid/article': {
      lastModified: '2025-03-01T00:00:00.000Z',
      submittedAt: '2025-03-02T12:00:00.000Z'
    }
  });
});

const page = (number: number): IndexNowPage => ({
  url: `https://example.invalid/${number}`,
  lastModified: null,
  submittedAt: null,
  needsSubmission: true,
  submissionReason: 'never-submitted'
});

test('n’enregistre rien lorsque le premier lot IndexNow échoue', async () => {
  const saved: string[] = [];
  await assert.rejects(processIndexNowBatches(
    [page(1)],
    10_000,
    async () => { throw new Error('IndexNow failure'); },
    async (batch) => { saved.push(...batch.map(({ url }) => url)); }
  ), /IndexNow failure/);
  assert.deepEqual(saved, []);
});

test('un succès partiel n’enregistre que les lots acceptés', async () => {
  const pages = Array.from({ length: 10_001 }, (_, index) => page(index));
  const saved: string[] = [];
  let calls = 0;
  await assert.rejects(processIndexNowBatches(
    pages,
    10_000,
    async () => {
      calls += 1;
      if (calls === 2) throw new Error('IndexNow failure');
    },
    async (batch) => { saved.push(...batch.map(({ url }) => url)); }
  ), /IndexNow failure/);
  assert.equal(saved.length, 10_000);
  assert.equal(saved.includes('https://example.invalid/10000'), false);
});
