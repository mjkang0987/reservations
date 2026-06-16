import {auth} from './auth';
import {CURRENT_TERMS_VERSION} from './utils/terms';

export default auth((req) => {
    const {pathname} = req.nextUrl;
    const user = req.auth?.user;

    // 약관 동의·온보딩 가드에서 항상 허용하는 경로 (인프라 + 동의/약관 관련 페이지)
    const isExempt =
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/logout') ||
        pathname.startsWith('/consent') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/privacy') ||
        pathname === '/favicon.ico';

    // 1) 약관 동의 게이트: 로그인된 실제 계정인데 현재 약관 버전 미동의 → /consent
    if (user?.id && !user.loginError && user.termsVersion !== CURRENT_TERMS_VERSION && !isExempt) {
        return Response.redirect(new URL('/consent', req.url));
    }

    // 2) 온보딩 게이트: 매장은 있으나 온보딩 미완료 → /onboarding
    const storeId = user?.storeId;
    const onboarded = user?.onboarded;
    if (storeId && !onboarded) {
        const isAllowed = pathname.startsWith('/onboarding') || isExempt;
        if (!isAllowed) {
            return Response.redirect(new URL('/onboarding', req.url));
        }
    }

    // 온보딩된 사용자가 온보딩 경로로 진입하면 페이지 가드가 이전 페이지로 돌려보냄
    // (미들웨어는 고정 URL로만 보낼 수 있어 '이전 페이지' 처리를 클라이언트 가드에 위임)
});

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
};
