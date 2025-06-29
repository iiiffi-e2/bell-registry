-- CreateEnum
CREATE TYPE "AlertFrequency" AS ENUM ('DAILY', 'WEEKLY');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "professionalRole" TEXT;

-- CreateTable
CREATE TABLE "JobAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roles" TEXT[],
    "locations" TEXT[],
    "frequency" "AlertFrequency" NOT NULL DEFAULT 'WEEKLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSent" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobAlert_userId_idx" ON "JobAlert"("userId");

-- CreateIndex
CREATE INDEX "JobAlert_isActive_idx" ON "JobAlert"("isActive");

-- CreateIndex
CREATE INDEX "JobAlert_frequency_idx" ON "JobAlert"("frequency");

-- AddForeignKey
ALTER TABLE "JobAlert" ADD CONSTRAINT "JobAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
