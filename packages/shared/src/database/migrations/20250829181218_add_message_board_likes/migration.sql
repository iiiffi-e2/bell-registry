-- CreateTable
CREATE TABLE "MessageBoardThreadLike" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageBoardThreadLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageBoardReplyLike" (
    "id" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageBoardReplyLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageBoardThreadLike_threadId_idx" ON "MessageBoardThreadLike"("threadId");

-- CreateIndex
CREATE INDEX "MessageBoardThreadLike_userId_idx" ON "MessageBoardThreadLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageBoardThreadLike_threadId_userId_key" ON "MessageBoardThreadLike"("threadId", "userId");

-- CreateIndex
CREATE INDEX "MessageBoardReplyLike_replyId_idx" ON "MessageBoardReplyLike"("replyId");

-- CreateIndex
CREATE INDEX "MessageBoardReplyLike_userId_idx" ON "MessageBoardReplyLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageBoardReplyLike_replyId_userId_key" ON "MessageBoardReplyLike"("replyId", "userId");

-- AddForeignKey
ALTER TABLE "MessageBoardThreadLike" ADD CONSTRAINT "MessageBoardThreadLike_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageBoardThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageBoardThreadLike" ADD CONSTRAINT "MessageBoardThreadLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageBoardReplyLike" ADD CONSTRAINT "MessageBoardReplyLike_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "MessageBoardReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageBoardReplyLike" ADD CONSTRAINT "MessageBoardReplyLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
