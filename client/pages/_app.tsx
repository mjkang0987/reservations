import React from 'react';

import Head from 'next/head';

import type {
    AppContext,
    AppProps
} from 'next/app';

import {SessionProvider} from 'next-auth/react';

import {GlobalStyle} from '../styles/globalStyle';

import LayoutComponent from '../components/LayoutComponent';

function App({Component, pageProps: {session, ...pageProps}}: AppProps) {
    return (
        <SessionProvider session={session}>
            <Head>
                <title>RESERVATION</title>
            </Head>
            <GlobalStyle/>
            <LayoutComponent>
                <Component {...pageProps} />
            </LayoutComponent>
        </SessionProvider>
    );
}

App.getInitialProps = async ({Component, ctx}: AppContext) => {
    const initProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

    const agent = ctx.req?.headers['user-agent'] ?? '';
    const desktopRegex = /windows nt|macintosh|linux/i;
    const isDesktop = desktopRegex.test(agent);

    return {
        pageProps: {
            ...initProps,
            isDesktop
        }
    };
};

export default App;
