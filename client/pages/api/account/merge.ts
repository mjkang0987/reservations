import type {NextApiRequest, NextApiResponse} from 'next';

import {auth} from '../../../auth';
import {prisma} from '../../../../server/db/prisma';
import {ROLE_PRIORITY} from '../../../../server/auth/roles';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({error: 'Method Not Allowed'});
    }

    const session = await auth(req, res);
    if (!session?.user?.id) return res.status(401).json({error: 'Unauthorized'});

    const pending = session.user.pendingMerge;
    if (!pending) {
        return res.status(400).json({error: 'No pending merge'});
    }

    const currentUserId = session.user.id;
    const {conflictUserId, provider, providerSub} = pending;

    if (currentUserId === conflictUserId) {
        return res.status(400).json({error: 'Cannot merge with self'});
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. 해당 AuthAccount가 아직 충돌 유저 소유인지 확인
            const targetAccount = await tx.authAccount.findUnique({
                where: {provider_providerSub: {provider, providerSub}},
                select: {userId: true},
            });

            if (!targetAccount || targetAccount.userId !== conflictUserId) {
                throw new Error('ALREADY_MERGED');
            }

            // 2. 해당 AuthAccount를 현재 유저로 이전
            await tx.authAccount.update({
                where: {provider_providerSub: {provider, providerSub}},
                data: {userId: currentUserId},
            });

            // 3. 충돌 유저의 나머지 AuthAccount 이전
            const remainingAccounts = await tx.authAccount.findMany({
                where: {userId: conflictUserId},
            });
            const currentProviders = await tx.authAccount.findMany({
                where: {userId: currentUserId},
                select: {provider: true},
            });
            const currentProviderSet = new Set(currentProviders.map((a) => a.provider));

            for (const ra of remainingAccounts) {
                if (currentProviderSet.has(ra.provider)) {
                    await tx.authAccount.delete({where: {id: ra.id}});
                } else {
                    await tx.authAccount.update({
                        where: {id: ra.id},
                        data: {userId: currentUserId},
                    });
                }
            }

            // 4. 멤버십 이전 (동일 매장이면 상위 역할 유지)
            const conflictMemberships = await tx.membership.findMany({
                where: {userId: conflictUserId},
            });
            const currentMemberships = await tx.membership.findMany({
                where: {userId: currentUserId},
            });
            const currentByStore = new Map(
                currentMemberships.map((m) => [m.storeId, m]),
            );

            for (const cm of conflictMemberships) {
                const existing = currentByStore.get(cm.storeId);
                if (existing) {
                    const existingPriority = ROLE_PRIORITY[existing.role] ?? 99;
                    const conflictPriority = ROLE_PRIORITY[cm.role] ?? 99;
                    if (conflictPriority < existingPriority) {
                        await tx.membership.update({
                            where: {id: existing.id},
                            data: {role: cm.role},
                        });
                    }
                    await tx.membership.delete({where: {id: cm.id}});
                } else {
                    await tx.membership.update({
                        where: {id: cm.id},
                        data: {userId: currentUserId},
                    });
                }
            }
        });

        return res.json({ok: true});
    } catch (error) {
        if (error instanceof Error && error.message === 'ALREADY_MERGED') {
            return res.status(409).json({error: '이미 병합된 상태입니다.'});
        }
        console.error('[merge] Account merge failed:', error);
        return res.status(500).json({error: '병합에 실패했습니다.'});
    }
}
