import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deduplicateSitemapUrls,
  filterAllowedUrls,
  getVerificationContent,
  isValidIndexNowKey,
  processIndexNowBatches
} from '../lib/indexnow/core.ts';

test('déduplique le sitemap et écarte les URL invalides ou externes', () => {
  const result = deduplicateSitemapUrls([
    { url: 'https://example.invalid/article' },
    { url: 'https://example.invalid/article#section' },
    { url: 'not-an-url' },
    { url: 'https://outside.invalid/article' }
  ], 'https://example.invalid');
  assert.deepEqual(result, ['https://example.invalid/article']);
});

test('filtre et déduplique les URL qui ne viennent pas du sitemap', () => {
  const allowed = new Set(['https://example.invalid/allowed']);
  assert.deepEqual(filterAllowedUrls([
    'https://example.invalid/allowed',
    'https://evil.invalid',
    'https://example.invalid/allowed'
  ], allowed), ['https://example.invalid/allowed']);
});

test('refuse une clé absente ou un mauvais nom de fichier de vérification', () => {
  assert.equal(isValidIndexNowKey('short'), false);
  assert.equal(getVerificationContent(null, 'anything.txt'), null);
  assert.equal(getVerificationContent('fake-key-123', 'wrong.txt'), null);
  assert.equal(getVerificationContent('fake-key-123', 'fake-key-123.txt'), 'fake-key-123');
});

test('découpe les envois par lots et retourne leur résultat', async () => {
  const urls = Array.from({ length: 10_001 }, (_, index) => `https://example.invalid/${index}`);
  const result = await processIndexNowBatches(urls, 10_000, async () => 200);
  assert.deepEqual(result.submittedUrls, urls);
  assert.deepEqual(result.batches, [
    { batch: 1, urlCount: 10_000, status: 200 },
    { batch: 2, urlCount: 1, status: 200 }
  ]);
});

test('un échec interrompt les lots suivants', async () => {
  const calls: number[] = [];
  await assert.rejects(processIndexNowBatches(
    ['https://example.invalid/1', 'https://example.invalid/2', 'https://example.invalid/3'],
    2,
    async (_batch, _submitted, batchNumber) => {
      calls.push(batchNumber);
      if (batchNumber === 2) throw new Error('IndexNow failure');
      return 202;
    }
  ), /IndexNow failure/);
  assert.deepEqual(calls, [1, 2]);
});
