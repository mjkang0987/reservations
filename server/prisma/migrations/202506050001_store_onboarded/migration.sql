-- Add onboarded flag to Store
-- 주의: 파일명이 2025로 오기되어 이름순 정렬상 init보다 먼저 실행된다.
-- 빈 DB에서는 Store가 아직 없으므로 no-op이며, onboarded 컬럼은 init의 Store 생성에 포함된다.
-- 기존 DB는 이미 적용 기록이 있어 재실행되지 않는다.
ALTER TABLE IF EXISTS "Store" ADD COLUMN IF NOT EXISTS "onboarded" BOOLEAN NOT NULL DEFAULT false;
