-- CreateTable
CREATE TABLE "MessageBoardThread" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReplyAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MessageBoardThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageBoardReply" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageBoardReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageBoardThread_createdAt_idx" ON "MessageBoardThread"("createdAt");

-- CreateIndex
CREATE INDEX "MessageBoardThread_lastReplyAt_idx" ON "MessageBoardThread"("lastReplyAt");

-- CreateIndex
CREATE INDEX "MessageBoardThread_isPinned_idx" ON "MessageBoardThread"("isPinned");

-- CreateIndex
CREATE INDEX "MessageBoardReply_threadId_idx" ON "MessageBoardReply"("threadId");

-- CreateIndex
CREATE INDEX "MessageBoardReply_createdAt_idx" ON "MessageBoardReply"("createdAt");

-- AddForeignKey
ALTER TABLE "MessageBoardThread" ADD CONSTRAINT "MessageBoardThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageBoardReply" ADD CONSTRAINT "MessageBoardReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageBoardReply" ADD CONSTRAINT "MessageBoardReply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageBoardThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
