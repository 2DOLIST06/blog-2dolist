CREATE TABLE "indexnow_submissions" (
    "url" TEXT NOT NULL,
    "last_modified" TEXT,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "indexnow_submissions_pkey" PRIMARY KEY ("url")
);
