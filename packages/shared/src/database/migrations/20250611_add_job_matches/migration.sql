-- CreateTable
CREATE TABLE "JobMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "matchFactors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobMatch_userId_idx" ON "JobMatch"("userId");

-- CreateIndex
CREATE INDEX "JobMatch_score_idx" ON "JobMatch"("score");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_userId_jobId_key" ON "JobMatch"("userId", "jobId");

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 