import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('[seed] Seed entry is ready.');
    console.log('[seed] Next step: import JSON source data into relational tables.');
}

main()
    .catch((error) => {
        console.error('[seed] Failed to run seed entry.');
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
