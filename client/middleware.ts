import {auth} from './auth';

export default auth((req) => {
    const {pathname} = req.nextUrl;
    const session = req.auth;
    const storeId = session?.user?.storeId;
    const onboarded = session?.user?.onboarded;

    // 인증된 사용자가 온보딩을 완료하지 않은 경우 → /onboarding 으로
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

    // 이미 온보딩 완료한 경우 → /onboarding 접근 시 메인으로
    if (onboarded && pathname.startsWith('/onboarding')) {
        return Response.redirect(new URL('/', req.url));
    }
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
