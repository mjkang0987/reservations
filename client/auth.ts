import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import Naver from 'next-auth/providers/naver';

export const {handlers, auth, signIn, signOut} = NextAuth({
    providers: [Google, Kakao, Naver],
    session: {
        strategy: 'jwt'
    },
    pages: {
        signIn: '/login'
    },
    callbacks: {
        authorized({auth}) {
            return !!auth?.user;
        },
        jwt({token, account}) {
            if (account) {
                token.sub = account.providerAccountId;
                token.provider = account.provider;
            }
            return token;
        },
        session({session, token}) {
            if (session.user) {
                session.user.id = token.sub ?? '';
                session.user.provider = (token.provider as string) ?? '';
            }
            return session;
        }
    }
});
