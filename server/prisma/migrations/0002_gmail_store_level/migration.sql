-- GmailConnection: 유저(개인) 단위 → 매장(store) 단위로 전환
-- 한 오너가 Gmail 을 연결하면 같은 매장의 모든 오너가 그 연결로 네이버 동기화를 쓸 수 있게 한다.

-- 1. 신규 컬럼 추가 (우선 nullable 로 추가해 기존 데이터 백필)
ALTER TABLE "GmailConnection" ADD COLUMN "storeId" TEXT;
ALTER TABLE "GmailConnection" ADD COLUMN "connectedByUserId" TEXT;

-- 2. 기존 연결 백필: 연결한 유저가 '오너'인 매장으로 storeId 설정, 연결자 기록
UPDATE "GmailConnection" gc
SET "connectedByUserId" = gc."userId",
    "storeId" = (
        SELECT m."storeId"
        FROM "Membership" m
        WHERE m."userId" = gc."userId" AND m."role" = 'owner'
        ORDER BY m."createdAt" ASC
        LIMIT 1
    );

-- 3. 오너 매장을 찾지 못한 연결(고아)은 제거
DELETE FROM "GmailConnection" WHERE "storeId" IS NULL;

-- 4. 같은 매장에 연결이 2개 이상이면 가장 최근(updatedAt) 것만 남김 (unique 보장)
DELETE FROM "GmailConnection" gc
USING "GmailConnection" dup
WHERE gc."storeId" = dup."storeId"
  AND gc."updatedAt" < dup."updatedAt";

-- 5. 기존 userId 제약·컬럼 제거
ALTER TABLE "GmailConnection" DROP CONSTRAINT "GmailConnection_userId_fkey";
DROP INDEX "GmailConnection_userId_key";
ALTER TABLE "GmailConnection" DROP COLUMN "userId";

-- 6. storeId NOT NULL + unique + FK, 연결자 FK
ALTER TABLE "GmailConnection" ALTER COLUMN "storeId" SET NOT NULL;
CREATE UNIQUE INDEX "GmailConnection_storeId_key" ON "GmailConnection"("storeId");
ALTER TABLE "GmailConnection" ADD CONSTRAINT "GmailConnection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GmailConnection" ADD CONSTRAINT "GmailConnection_connectedByUserId_fkey" FOREIGN KEY ("connectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
