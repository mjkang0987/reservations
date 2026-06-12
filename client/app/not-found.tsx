'use client';

import {useEffect, useState} from 'react';

const REDIRECT_SECONDS = 5;

// app 라우터 전역 not-found — pages/404.tsx와 동일한 디자인.
// app/ 디렉터리(NextAuth route handler)가 존재하면 잘못된 경로의 404는
// app 라우터가 처리하므로 여기에 안내·리다이렉트를 구현한다.
// 전역 스타일(styled-components)은 pages 전용이라 디자인 토큰 값을 직접 사용.
const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsla(0, 0%, 0%, .03)',
        padding: 24,
        fontFamily: 'inherit',
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        background: 'hsl(0, 0%, 100%)',
        borderRadius: 8,
        padding: '48px 40px',
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
    },
    code: {
        fontSize: 64,
        fontWeight: 700,
        lineHeight: 1,
        color: '#6526d9',
        margin: 0,
    },
    title: {
        fontSize: 18,
        fontWeight: 600,
        color: 'hsl(0, 0%, 13%)',
        margin: 0,
    },
    desc: {
        fontSize: 13,
        color: 'hsl(0, 0%, 65%)',
        lineHeight: 1.6,
        margin: 0,
    },
    notice: {
        fontSize: 12,
        color: 'hsl(0, 0%, 65%)',
        margin: 0,
    },
    homeLink: {
        display: 'inline-block',
        marginTop: 8,
        height: 36,
        lineHeight: '36px',
        padding: '0 20px',
        background: '#6526d9',
        color: 'hsl(0, 0%, 100%)',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
    },
};

export default function NotFound() {
    const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

    useEffect(() => {
        if (secondsLeft <= 0) {
            window.location.replace('/');
            return;
        }
        const timerId = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearTimeout(timerId);
    }, [secondsLeft]);

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <p style={styles.code}>404</p>
                <h1 style={styles.title}>페이지를 찾을 수 없습니다</h1>
                <p style={styles.desc}>요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
                <p style={styles.notice}>{secondsLeft}초 후 홈으로 자동 이동합니다.</p>
                <a style={styles.homeLink} href="/">홈으로 돌아가기</a>
            </div>
        </div>
    );
}
