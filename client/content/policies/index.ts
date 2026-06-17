import {TERMS_BODY} from './terms';
import {PRIVACY_BODY} from './privacy';
import {DPA_BODY} from './dpa';

// 정책 문서 레지스트리. 본문은 각 문서 파일이 단일 소스이고,
// 여기서는 제목 등 메타데이터만 모은다.
// - navTitle: 앱 인라인 페이지의 PageHero 제목 / 브라우저 탭 제목
// - docTitle: 풀페이지(독립 HTML)의 <h1> 제목
export const POLICIES = {
    terms: {navTitle: '이용약관', docTitle: 'TAS 이용약관', body: TERMS_BODY},
    privacy: {navTitle: '개인정보처리방침', docTitle: 'TAS 개인정보 처리방침', body: PRIVACY_BODY},
    dpa: {navTitle: '개인정보 처리 위탁계약', docTitle: '개인정보 처리 위탁계약 (DPA)', body: DPA_BODY},
} as const;

export type PolicySlug = keyof typeof POLICIES;

export const POLICY_SLUGS = Object.keys(POLICIES) as PolicySlug[];

export const isPolicySlug = (value: unknown): value is PolicySlug =>
    typeof value === 'string' && value in POLICIES;
