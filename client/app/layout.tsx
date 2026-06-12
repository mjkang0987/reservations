import type {Metadata} from 'next';

// app 라우터 최소 루트 레이아웃 — not-found 등 app 라우터 화면에만 적용된다.
// (실제 페이지는 모두 pages 라우터: _app.tsx/_document.tsx가 담당)
export const metadata: Metadata = {
    title: '페이지를 찾을 수 없습니다 | Take a seat',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="ko">
            <body style={{margin: 0, fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"}}>
                {children}
            </body>
        </html>
    );
}
