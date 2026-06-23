# 작업 계획

> 진행 중인 작업의 배경·범위·구현 항목·리스크를 적는다. 완료되면 비운다.

## 배경 / 문제

디자이너 저장 API(`server/api/designers.ts` PUT)가 전체 디자이너 목록을 받아
**디자이너마다 upsert + 그 디자이너의 요일 스케줄(최대 7개)마다 upsert**를 한다.
- 쿼리 수: `1 deleteMany(삭제분) + N upsert(디자이너) + N×최대7 upsert(스케줄)` ≈ **N×8**.
- 트랜잭션으로 묶여 있어 데이터 유실은 없지만(서비스와 달리 원자성은 이미 확보),
  스케줄 N+1이 가장 큰 왕복 비용. 어제 고객(58111b8)·서비스(e5ce020)와 같은 계열.

## 범위 / 결정사항

- 이번 작업 범위: **`server/api/designers.ts` PUT 핸들러만**. 클라이언트(전체 목록 전송)는
  이번에 건드리지 않는다(디자이너 수는 보통 한 자리라 페이로드는 수용 가능).
- **디자이너 행 자체는 upsert 유지**: 예약(`Reservation.designerId`)이 Designer를 FK로 참조 →
  서비스처럼 delete-recreate하면 예약-디자이너 연결이 끊긴다. 행을 보존해야 함.
  (삭제 대상 디자이너의 예약 연결 차단 검증도 그대로 유지)
- **스케줄만 일괄 교체**: 디자이너별 요일 upsert(N×7) 대신, 루프에서 스케줄 row를 모아
  업서트된 디자이너들의 스케줄을 `deleteMany` 후 `createMany` 단일 호출로 재삽입.
  → 스케줄 쿼리: `N×7 upsert` → `1 deleteMany + 1 createMany`.
  → 전체: `N×8` → `N(디자이너 upsert) + 3`.

## 구현 항목

### 서버

- `server/api/designers.ts` PUT (현재 69~115行 트랜잭션 내부):
  - 디자이너 upsert 루프는 유지하되, 안에서 스케줄을 `scheduleRows`로 수집.
  - 루프 종료 후, **스케줄 데이터가 온 디자이너(`scheduledDesignerIds`)만**
    `deleteMany({where:{designerId:{in: scheduledDesignerIds}}})` → `createMany({data: scheduleRows})`.
  - 스케줄이 payload에 없는 디자이너의 기존 스케줄은 건드리지 않음(원동작 보존).
  - 스케줄 필드: designerId, dayIndex, enabled, startTime(=schedule.start), endTime(=schedule.end).

### 클라이언트

- 변경 없음(이번 범위 아님).

## 리스크 / 주의

- `designerSchedule`의 `@@unique([designerId, dayIndex])`: `entries()` 인덱스는 0~6 고유라
  한 디자이너 안에서 dayIndex 중복 없음 → createMany 위반 없음.
- 트랜잭션 원자성 유지(deleteMany schedules → createMany는 같은 tx 안).
- 운영 DB 마이그레이션 불필요(스키마 변경 없음).
- 디자이너 upsert는 값이 행마다 달라 배치 불가 → N 유지(보통 수 개라 비용 낮음).
