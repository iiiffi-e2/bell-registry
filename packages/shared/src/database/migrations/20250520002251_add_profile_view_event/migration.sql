-- CreateTable
CREATE TABLE "ProfileViewEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileViewEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProfileViewEvent" ADD CONSTRAINT "ProfileViewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
