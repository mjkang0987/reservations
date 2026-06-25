-- 매장 기능 토글: 적립금 시스템 / 회원권 시스템 사용 여부.
-- 기존 매장 기본값은 꺼짐(false). 적립금은 이미 쓰던 매장도 명시적으로 켜야 메뉴가 보인다.
-- IF NOT EXISTS: Supabase 등에서 컬럼을 수동 추가했어도 migrate deploy 가 충돌 없이 통과하도록.
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "usePointSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "useMembershipSystem" BOOLEAN NOT NULL DEFAULT false;
