-- AlterTable
ALTER TABLE "FutureSelf"
  ADD COLUMN "title" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "identityStatement" TEXT;

UPDATE "FutureSelf"
SET
  "title" = COALESCE(NULLIF("identity", ''), 'Future Self'),
  "description" = "vision",
  "identityStatement" = COALESCE(NULLIF("identity", ''), 'I am becoming the person I intend to be.');

ALTER TABLE "FutureSelf"
  ALTER COLUMN "title" SET NOT NULL,
  ALTER COLUMN "identityStatement" SET NOT NULL,
  DROP COLUMN "identity",
  DROP COLUMN "vision",
  DROP COLUMN "currentGap";

-- AlterTable
ALTER TABLE "LifeArea"
  ADD COLUMN "currentReality" TEXT,
  ADD COLUMN "gap" TEXT;
