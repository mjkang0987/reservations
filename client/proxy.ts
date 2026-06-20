import {auth} from './auth';
import {CURRENT_TERMS_VERSION} from './utils/terms';

export default auth((req) => {
    const {pathname} = req.nextUrl;
    const user = req.auth?.user;

    // run.app(Cloud Run 기본 URL)로 들어온 트래픽은 정식 도메인으로 정규화(308).
    // OAuth 콜백·세션 쿠키·AdSense가 모두 takeaseat.co.kr 기준이라, run.app 접속은
    // 로그인이 깨지고 광고 도메인도 어긋난다. host만 바꿔 같은 경로로 영구 리다이렉트.
    const host = req.headers.get('host') ?? '';
    if (host.endsWith('.run.app')) {
        const url = req.nextUrl.clone();
        url.protocol = 'https:';
        url.host = 'takeaseat.co.kr';
        url.port = '';
        return Response.redirect(url, 308);
    }

    // 약관 동의·온보딩 가드에서 항상 허용하는 경로 (인프라 + 동의/약관 관련 페이지)
    const isExempt =
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/about') ||
        pathname.startsWith('/logout') ||
        pathname.startsWith('/consent') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/privacy') ||
        pathname === '/favicon.ico';

    // 0) DPA(처리위탁) 약관은 운영자 전용 — 미인증(SNS 로그인 안 함) 접근은 로그인으로 보낸다.
    if (pathname.startsWith('/dpa') && !user?.id) {
        return Response.redirect(new URL('/login', req.url));
    }

    // 1) 약관 동의 게이트: 로그인된 실제 계정인데 현재 약관 버전 미동의 → /consent
    //    단, 게스트로 이미 동의(쿠키)한 경우는 통과시키고 처리위탁(DPA) 동의만 앱 위 레이어로 받는다.
    const guestTermsAgreed = req.cookies.get('tas-guest-terms')?.value === CURRENT_TERMS_VERSION;
    if (user?.id && !user.loginError && user.termsVersion !== CURRENT_TERMS_VERSION && !isExempt && !guestTermsAgreed) {
        return Response.redirect(new URL('/consent', req.url));
    }

    // 2) 온보딩 게이트: 매장은 있으나 온보딩 미완료 → /onboarding
    //    단, 게스트로 이미 온보딩·동의(쿠키)한 경우는 온보딩 페이지 대신 데이터 마이그레이션으로 처리하므로 건너뜀.
    const storeId = user?.storeId;
    const onboarded = user?.onboarded;
    if (storeId && !onboarded && !guestTermsAgreed) {
        const isAllowed = pathname.startsWith('/onboarding') || isExempt;
        if (!isAllowed) {
            return Response.redirect(new URL('/onboarding', req.url));
        }
    }

    // 온보딩된 사용자가 온보딩 경로로 진입하면 페이지 가드가 이전 페이지로 돌려보냄
    // (미들웨어는 고정 URL로만 보낼 수 있어 '이전 페이지' 처리를 클라이언트 가드에 위임)
});

// /login도 미들웨어가 타게 둠 — run.app→도메인 정규화가 로그인 페이지에도 적용되도록.
// (login은 아래 동의/온보딩 게이트에서는 isExempt로 그대로 통과)
export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
