# 작업 계획

> 진행 중인 작업의 배경·범위·구현 항목·리스크를 적는다. 완료되면 비운다.

---

## 완료(최근) — 캘린더 타임라인: 영업시간 연동 + 표시 개선

> 배포 완료. 상세는 git 히스토리(`d5a2333`·`4fdbba4`·`456750a` 외 `9ae39ab`·`ab7fe43`).

- **A 영업시간 → 축 연동**: `getTimelineRange(viewType, businessHours)`(`utils/timelineRange.ts`) 신설. `Timeline`/`TimelineTitle`이 `storeSettings.businessHours` 구독. 모든 뷰 영업시간 그대로(패딩 0). 죽은 `store.time` 슬라이스 제거.
- **B 표시/동작**: 1시간=100px(30분=50px) 단일화, 현재시간 바 드리프트 수정, 빈 곳 클릭 예약추가 좌표 수정(이전 구버전은 클릭 단위 불일치로 하단 클릭이 ~3h 어긋남 → 수정됨).
- **실측(Playwright)**: 영업시간 변경 시 일/3일/주 축 반영, 빈 곳 클릭·드래그 이동 시작시각 모두 정확 확인.

---

## 완료 — 디자이너 영구 삭제 (분리 삭제 방식)

> 구현·빌드 검증 완료. 상세는 git 히스토리.
> 결정: **디자이너만 분리 삭제** — 디자이너+스케줄은 제거하되 과거 예약은 `designerId` 미지정으로 보존. 절대 차단되지 않음(예약 cascade 삭제 X).
> UI: "퇴직자" 섹션 카드에만 "영구 삭제" 버튼 노출(2단계 안전장치). 확인 모달에 영향받는 예약 건수 표기.

### 배경/현황 (조사 결과)
- 서버 `designers.ts`는 PUT-by-omission으로 하드 삭제하되 **예약 연결 시 400 차단**. 영속화 `syncToServer`는 **에러를 삼키고 로컬 낙관적 제거** → 기존 `deleteDesigner`를 그대로 버튼에 붙이면 "화면선 사라지나 서버 거부 → 새로고침 시 부활" 버그. 그래서 전용 DELETE 엔드포인트로 간다.
- DB: `DesignerSchedule`은 onDelete Cascade(자동), `Reservation.designerId`는 optional FK → 트랜잭션에서 명시적 `updateMany(null)` 후 designer.delete.
- 프런트 `Reservation.designerId: number | null`, UI는 이미 `null`을 "미지정" 표시 → 분리 삭제와 정합.

### 구현 항목
1. **`server/api/designers.ts`** — `DELETE` 추가. `requireRole('owner')`, body `{ id }`(legacyId) → `storeId_legacyId`로 해석. 트랜잭션: `reservation.updateMany({designerId:해당 → null})` → `designer.delete()`(스케줄 Cascade). `Allow`에 DELETE 추가. 미존재 시 404.
2. **`store/calendarStoreHelpers.ts`** — `deleteDesignerOnServer(id)` 추가(`deleteCustomerOnServer` 패턴). 원격 DELETE, 로컬 모드는 스냅샷에서 디자이너 제거 + 해당 예약 designerId=null.
3. **`store/calendarStore.ts`** — `deleteDesigner` 액션 수정: PUT-by-omission 제거 → 디자이너 상태 제거 + `reservationMap` 내 해당 예약 designerId=null + `deleteDesignerOnServer(id)`.
4. **`components/settings/DesignerManageSection.tsx`** — "영구 삭제" UI 추가. **퇴직자 섹션에만** 노출(2단계 안전장치: 재직→삭제(퇴직)→영구 삭제). 확인 모달에 "예약 N건은 '미지정'으로 남고 디자이너는 영구 삭제됩니다" 안내 후 `deleteDesigner(id)`.
5. **문서**: 완료 후 `index.md`·`plan.md` 갱신.

### 리스크
- 분리 삭제라 예약 데이터 손실 없음. 단 매출/통계에서 해당 예약은 "미지정"으로 집계됨(의도된 동작).
- 로컬 모드 스냅샷과 원격 동작 일치 확인 필요.

---

## 다가오는 작업 — 읽기 과부하/페이징(③) + 매출 서버화(A)

> 설계 상세: [docs/reading-overload-pagination.md](docs/reading-overload-pagination.md).

### 트리거 (재산정 2026-06-23)
- 6/1~6/23(23일) 예약 ~60건 ≈ **월 ~80~100건+**(월말 전). **네이버 예약 API 연동 추가 예정** → 유입 가속.
- 러프: **3~4개월 → 누적 수백 건**(B 트리거 "미래 예약 수백+" 도달), **~1년 → 수천**. ReservationHistory는 더 빠름.
- → 무기한 보류 아님. **몇 달 내** 현실화.

### 순서
1. ~~**B-1 공통 로직 추출**~~ — **완료**. `calendarStoreServiceHelpers.ts`에 인라인이던 `minutesBetween`·수동판정(`isPriceManual`/`isDurationManual`)을 `features/services/model.ts`로 이동(무동작 변경, `export *`로 자동 재export, 서버 import 가능). `parseServiceString`/`sumPrice`/`sumDurationMinutes`/`calcEndTime`/`LEGACY_NAME_MAP`은 이미 model에 있었음.
2. **네이버 연동 마일스톤에 결합**:
   - `naver-booking-sync.ts:88` 매 폴링 전체예약 풀스캔 **bound**(연동 시 그 파일 만지므로 같이) — 인덱스+범위/증분.
   - **A(매출 집계 서버화)** 를 이 마일스톤으로 끌어와 착수(연동으로 데이터 곧 늘어 명분 생김). A 스텝은 docs "A" 섹션 참조.
3. **B-3 페이징 / B-2 updateService 서버화 / B-4 고객 페이징**: 누적 수백~수천 신호 시(몇 달 내 예상). A가 선결로 먼저 돼 있게.

### A 주의 (착수 시)
- 원격 전용 + local(`shouldUseLocalDb`)은 클라 계산 유지(모드 분기). 서버는 revenue.ts **순수함수 재사용**(query→`dbReservationToFrontend`→`groupByDate`→동일 함수 호출, 재구현 X).
- 예외: `getRevenueInsights` 신규/재방문은 범위 밖 이력 필요 → stored `Customer.firstVisitDate` 사용.
- 회귀=매출 오표시 → 클라==서버 합계 일치 검증.
