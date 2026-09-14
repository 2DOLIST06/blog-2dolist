import type { IndexNowHistory, IndexNowPage } from './core';

export type IndexNowSubmissionRecord = {
  url: string;
  lastModified: string | null;
  submittedAt: Date;
};

export type IndexNowSubmissionDatabase = {
  findMany(): Promise<IndexNowSubmissionRecord[]>;
  upsert(args: {
    where: { url: string };
    create: IndexNowSubmissionRecord;
    update: Omit<IndexNowSubmissionRecord, 'url'>;
  }): Promise<unknown>;
};

export async function readIndexNowHistory(database: IndexNowSubmissionDatabase): Promise<IndexNowHistory> {
  const records = await database.findMany();
  return Object.fromEntries(records.map((record) => [record.url, {
    lastModified: record.lastModified,
    submittedAt: record.submittedAt.toISOString()
  }]));
}

export async function saveSuccessfulIndexNowSubmissions(
  database: IndexNowSubmissionDatabase,
  pages: IndexNowPage[],
  submittedAt: Date
) {
  await Promise.all(pages.map((page) => database.upsert({
    where: { url: page.url },
    create: { url: page.url, lastModified: page.lastModified, submittedAt },
    update: { lastModified: page.lastModified, submittedAt }
  })));
}
