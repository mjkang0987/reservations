import {auth} from './auth';

export default auth((req) => {
    const {pathname} = req.nextUrl;
    const session = req.auth;
    const storeId = session?.user?.storeId;
    const onboarded = session?.user?.onboarded;

    if (storeId && !onboarded) {
        const isAllowed =
            pathname.startsWith('/onboarding') ||
            pathname.startsWith('/api/') ||
            pathname.startsWith('/login') ||
            pathname.startsWith('/logout') ||
            pathname.startsWith('/_next') ||
            pathname === '/favicon.ico';

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
