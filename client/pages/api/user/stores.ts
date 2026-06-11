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

    const memberships = await prisma.membership.findMany({
        where: {userId: session.user.id},
        select: {
            role: true,
            store: {select: {id: true, name: true}},
        },
    });

    const stores = memberships.map((m) => ({
        storeId: m.store.id,
        storeName: m.store.name,
        role: m.role,
    }));

    return res.json({stores});
}
