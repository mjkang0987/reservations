import {Prisma} from '@prisma/client';
import type {Account, User} from 'next-auth';

import {prisma} from '../db/prisma';

type SyncAuthUserParams = {
    account: Account;
    user?: User;
};

type SyncedAuthUser = {
    id: string;
    nickname: string;
    image: string | null;
};

const ADJECTIVES = [
    '빠른', '조용한', '반짝이는', '든든한', '기민한', '상냥한', '산뜻한', '영리한',
    '부드러운', '선명한', '고요한', '유연한', '차분한', '활기찬', '단단한', '기쁜',
];

const NOUNS = [
    '고래', '사자', '여우', '호랑이', '돌고래', '부엉이', '토끼', '하늘', '바다', '별',
    '달', '숲', '파도', '바람', '구름', '노을',
];

function randomItem(values: string[]): string {
    return values[Math.floor(Math.random() * values.length)];
}

function buildNicknameCandidate(): string {
    const number = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${randomItem(ADJECTIVES)}${randomItem(NOUNS)}${number}`;
}

function buildFallbackNicknameCandidate(): string {
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${buildNicknameCandidate()}_${suffix}`;
}

async function generateUniqueNickname(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = buildNicknameCandidate();
        const existing = await prisma.user.findUnique({
            where: {nickname: candidate},
            select: {id: true},
        });

        if (!existing)
            return candidate;
    }

    throw new Error('Failed to generate a unique nickname after multiple attempts.');
}

async function generateFallbackUniqueNickname(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
        const candidate = buildFallbackNicknameCandidate();
        const existing = await prisma.user.findUnique({
            where: {nickname: candidate},
            select: {id: true},
        });

        if (!existing)
            return candidate;
    }

    throw new Error('Failed to generate a fallback unique nickname after multiple attempts.');
}

export async function syncAuthUser({account, user}: SyncAuthUserParams): Promise<SyncedAuthUser | null> {
    if (!process.env.DATABASE_URL) {
        return null;
    }

    const email = user?.email ?? null;
    const image = user?.image ?? null;
    const provider = account.provider;
    const providerSub = account.providerAccountId;

    const existingAccount = await prisma.authAccount.findUnique({
        where: {
            provider_providerSub: {
                provider,
                providerSub,
            },
        },
        select: {
            id: true,
            user: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
        },
    });

    if (existingAccount) {
        const savedUser = await prisma.user.update({
            where: {id: existingAccount.user.id},
            data: {
                name: existingAccount.user.nickname,
                image,
            },
            select: {id: true, nickname: true, image: true},
        });

        return savedUser;
    }

    if (email) {
        const existingUser = await prisma.user.findUnique({
            where: {email},
            select: {id: true, nickname: true},
        });

        if (existingUser) {
            const savedUser = await prisma.user.update({
                where: {id: existingUser.id},
                data: {
                    email,
                    name: existingUser.nickname,
                    image,
                    accounts: {
                        create: {
                            provider,
                            providerSub,
                        },
                    },
                },
                select: {id: true, nickname: true, image: true},
            });

            return savedUser;
        }
    }

    for (let attempt = 0; attempt < 5; attempt++) {
        const nickname = await generateUniqueNickname();

        try {
            const createdUser = await prisma.user.create({
                data: {
                    email,
                    nickname,
                    name: nickname,
                    image,
                    accounts: {
                        create: {
                            provider,
                            providerSub,
                        },
                    },
                },
                select: {id: true, nickname: true, image: true},
            });

            return createdUser;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                continue;
            }

            throw error;
        }
    }

    for (let attempt = 0; attempt < 5; attempt++) {
        const nickname = await generateFallbackUniqueNickname();

        try {
            const createdUser = await prisma.user.create({
                data: {
                    email,
                    nickname,
                    name: nickname,
                    image,
                    accounts: {
                        create: {
                            provider,
                            providerSub,
                        },
                    },
                },
                select: {id: true, nickname: true, image: true},
            });

            return createdUser;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                continue;
            }

            throw error;
        }
    }

    throw new Error('Failed to create a user with a unique nickname.');
}
