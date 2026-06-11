import type {NextApiRequest, NextApiResponse} from 'next';

import {auth} from '../../../auth';
import {prisma} from '../../../../server/db/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({error: 'Method Not Allowed'});
    }

    const session = await auth(req, res);
    if (!session?.user?.id) return res.status(401).json({error: 'Unauthorized'});

    const pending = session.user.pendingMerge;
    if (!pending) {
        return res.status(404).json({error: 'No pending merge'});
    }

    const memberships = await prisma.membership.findMany({
        where: {userId: pending.conflictUserId},
        select: {
            role: true,
            store: {select: {name: true}},
        },
    });

    return res.json({
        provider: pending.provider,
        memberships: memberships.map((m) => ({
            storeName: m.store.name,
            role: m.role,
        })),
    });
}
