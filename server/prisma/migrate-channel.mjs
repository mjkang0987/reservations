import {createRequire} from 'node:module';

import {PrismaClient} from '../../client/prisma/generated/prisma/client.ts';

const require = createRequire(new URL('../../client/package.json', import.meta.url));
require('dotenv').config();
const {PrismaPg} = require('@prisma/adapter-pg');

const prisma = new PrismaClient({adapter: new PrismaPg({connectionString: process.env.DATABASE_URL})});

async function main() {
    const result = await prisma.reservation.updateMany({
        where: {naverBookingId: {not: null}},
        data: {channel: 'naver'},
    });

    console.log(`[migrate-channel] Updated ${result.count} naver reservations to channel='naver'`);
}

main()
    .catch((error) => {
        console.error('[migrate-channel] Failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
