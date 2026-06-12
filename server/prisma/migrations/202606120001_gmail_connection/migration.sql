-- Gmail 연동을 로그인 계정(AuthAccount)과 분리: 전용 GmailConnection 테이블
CREATE TABLE "GmailConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GmailConnection_userId_key" ON "GmailConnection"("userId");

ALTER TABLE "GmailConnection" ADD CONSTRAINT "GmailConnection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 기존 구글 로그인에서 저장된 Gmail 토큰을 연동 정보로 이관 (refresh 토큰이 있는 계정만 유효)
-- AuthAccount의 토큰 컬럼은 마이그레이션 히스토리가 아닌 db push로만 존재하므로(드리프트),
-- 컬럼이 있는 DB(기존 운영 DB)에서만 백필을 실행한다. 빈 DB 재생 시에는 이관할 데이터도 없다.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'AuthAccount'
          AND column_name = 'accessToken'
    ) THEN
        RETURN;
    END IF;

    INSERT INTO "GmailConnection" ("id", "userId", "email", "accessToken", "refreshToken", "tokenExpiresAt", "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, a."userId", COALESCE(u."email", ''), a."accessToken", a."refreshToken", a."tokenExpiresAt", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM "AuthAccount" a
    JOIN "User" u ON u."id" = a."userId"
    WHERE a."provider" = 'google'
      AND a."accessToken" IS NOT NULL
      AND a."refreshToken" IS NOT NULL;
END $$;
