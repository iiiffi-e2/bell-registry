-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_settingKey_key" ON "SystemSettings"("settingKey");

-- CreateIndex
CREATE INDEX "SystemSettings_settingKey_idx" ON "SystemSettings"("settingKey");

-- CreateIndex
CREATE INDEX "SystemSettings_updatedAt_idx" ON "SystemSettings"("updatedAt");

-- AddForeignKey
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 