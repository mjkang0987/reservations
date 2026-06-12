-- db push로만 반영되어 마이그레이션 히스토리에 없던 스키마 변경분을 복구 (드리프트 수리)
-- 기존 운영 DB에는 모두 이미 존재하므로 전 구문 멱등(IF NOT EXISTS) — no-op으로 기록만 남는다.
-- 빈 DB 재생 시에는 이 마이그레이션이 적용되어 schema.prisma와 완전히 일치하게 된다.

-- CreateEnum (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReservationChannel') THEN
        CREATE TYPE "ReservationChannel" AS ENUM ('naver', 'walk_in', 'phone');
    END IF;
END $$;

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'discount';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'naver_deposit';

-- AlterTable: AuthAccount OAuth 토큰 컬럼
ALTER TABLE "AuthAccount"
    ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
    ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
    ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3);

-- AlterTable: Reservation 네이버 예약 연동 컬럼
ALTER TABLE "Reservation"
    ADD COLUMN IF NOT EXISTS "channel" "ReservationChannel" NOT NULL DEFAULT 'phone',
    ADD COLUMN IF NOT EXISTS "naverBookingId" TEXT,
    ADD COLUMN IF NOT EXISTS "naverBookingUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "naverDeposit" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerMergeHistory" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sourceCustomerJson" JSONB NOT NULL,
    "targetCustomerJson" JSONB NOT NULL,
    "movedReservationIds" JSONB NOT NULL DEFAULT '[]',
    "movedPointHistoryIds" JSONB NOT NULL DEFAULT '[]',
    "addedMemoTagIds" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerMergeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerMergeHistory_storeId_idx" ON "CustomerMergeHistory"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_storeId_naverBookingId_key" ON "Reservation"("storeId", "naverBookingId");
