import type { IndexNowHistory, IndexNowPage } from './core';

export type IndexNowSubmissionRecord = {
  url: string;
  contentLastModifiedAt: Date | null;
  lastSubmittedAt: Date;
};

export type IndexNowSubmissionDatabase = {
  findMany(args: {
    select: { url: true; contentLastModifiedAt: true; lastSubmittedAt: true };
  }): Promise<IndexNowSubmissionRecord[]>;
  upsert(args: {
    where: { url: string };
    create: { url: string; contentLastModifiedAt: Date | null; lastSubmittedAt: Date };
    update: { contentLastModifiedAt: Date | null; lastSubmittedAt: Date };
  }): Promise<unknown>;
};

export async function readIndexNowHistory(database: IndexNowSubmissionDatabase): Promise<IndexNowHistory> {
  const records = await database.findMany({
    select: { url: true, contentLastModifiedAt: true, lastSubmittedAt: true }
  });
  return Object.fromEntries(records.map((record) => [record.url, {
    lastModified: record.contentLastModifiedAt?.toISOString() ?? null,
    submittedAt: record.lastSubmittedAt.toISOString()
  }]));
}

export async function saveSuccessfulIndexNowSubmissions(
  database: IndexNowSubmissionDatabase,
  pages: IndexNowPage[],
  submittedAt: Date
) {
  await Promise.all(pages.map((page) => database.upsert({
    where: { url: page.url },
    create: {
      url: page.url,
      contentLastModifiedAt: page.lastModified ? new Date(page.lastModified) : null,
      lastSubmittedAt: submittedAt
    },
    update: {
      contentLastModifiedAt: page.lastModified ? new Date(page.lastModified) : null,
      lastSubmittedAt: submittedAt
    }
  })));
}
