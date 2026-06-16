import type {NextApiRequest, NextApiResponse} from 'next';

import {auth} from '../../client/auth';
import {CURRENT_TERMS_VERSION} from '../../client/utils/terms';
import {prisma} from '../db/prisma';

// 이용약관/개인정보처리방침 동의 기록
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const session = await auth(req, res);
    const userId = session?.user?.id;

    if (!userId || session?.user?.loginError) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        await prisma.user.update({
            where: {id: userId},
            data: {
                agreedTermsVersion: CURRENT_TERMS_VERSION,
                agreedTermsAt: new Date(),
            },
        });
    } catch {
        return res.status(404).json({error: 'User not found'});
    }

    return res.status(200).json({ok: true, version: CURRENT_TERMS_VERSION});
}
