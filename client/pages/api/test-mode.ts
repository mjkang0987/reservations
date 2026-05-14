import type {NextApiRequest, NextApiResponse} from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json({testMode: process.env.TEST_DB === '1'});
}
