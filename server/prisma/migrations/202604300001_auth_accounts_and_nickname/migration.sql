-- CreateTable
CREATE TABLE "AuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSub" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthAccount_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "User" ADD COLUMN "nickname" TEXT;

-- Backfill nickname from existing display name/email/id before enforcing NOT NULL + UNIQUE
UPDATE "User"
SET "nickname" = COALESCE(
    NULLIF(BTRIM("name"), ''),
    NULLIF(SPLIT_PART(COALESCE("email", ''), '@', 1), ''),
    '회원_' || SUBSTRING("id" FROM 1 FOR 8)
)
WHERE "nickname" IS NULL;

-- Resolve duplicate nicknames deterministically
WITH ranked AS (
    SELECT "id",
           "nickname",
           ROW_NUMBER() OVER (PARTITION BY "nickname" ORDER BY "createdAt", "id") AS row_num
    FROM "User"
)
UPDATE "User" u
SET "nickname" = ranked."nickname" || ranked.row_num
FROM ranked
WHERE u."id" = ranked."id"
  AND ranked.row_num > 1;

ALTER TABLE "User" ALTER COLUMN "nickname" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "AuthAccount_provider_providerSub_key" ON "AuthAccount"("provider", "providerSub");

-- CreateIndex
CREATE INDEX "AuthAccount_userId_idx" ON "AuthAccount"("userId");

-- Backfill auth account rows from legacy provider columns
INSERT INTO "AuthAccount" ("id", "userId", "provider", "providerSub", "createdAt", "updatedAt")
SELECT 'acc_' || md5("id" || ':' || "provider" || ':' || "providerSub"), "id", "provider", "providerSub", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
WHERE "provider" IS NOT NULL
  AND "providerSub" IS NOT NULL
ON CONFLICT ("provider", "providerSub") DO NOTHING;

-- AddForeignKey
ALTER TABLE "AuthAccount" ADD CONSTRAINT "AuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop legacy provider columns after backfill
ALTER TABLE "User" DROP COLUMN "provider";
ALTER TABLE "User" DROP COLUMN "providerSub";
