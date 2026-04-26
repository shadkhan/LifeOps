-- AlterTable
ALTER TABLE "LifeArea"
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "LifeArea_userId_deletedAt_idx" ON "LifeArea"("userId", "deletedAt");
