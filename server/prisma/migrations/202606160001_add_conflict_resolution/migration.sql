-- 충돌(중복 예약) 처리 사유 저장 테이블
CREATE TABLE "ConflictResolution" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "conflictKey" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "memo" TEXT,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConflictResolution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConflictResolution_storeId_conflictKey_key" ON "ConflictResolution"("storeId", "conflictKey");
CREATE INDEX "ConflictResolution_storeId_idx" ON "ConflictResolution"("storeId");
