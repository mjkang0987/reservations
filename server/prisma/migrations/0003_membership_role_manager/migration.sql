-- MembershipRole enum에 manager 추가 (owner/staff 사이). 추가형이라 기존 데이터 영향 없음.
ALTER TYPE "MembershipRole" ADD VALUE IF NOT EXISTS 'manager' BEFORE 'staff';
