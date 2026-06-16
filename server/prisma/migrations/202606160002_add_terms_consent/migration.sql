-- 이용약관/개인정보처리방침 동의 기록 (동의 버전 + 동의 시각)
ALTER TABLE "User" ADD COLUMN "agreedTermsVersion" TEXT;
ALTER TABLE "User" ADD COLUMN "agreedTermsAt" TIMESTAMP(3);
