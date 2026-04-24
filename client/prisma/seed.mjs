import {PrismaClient} from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const DEFAULT_STORE_KEY = 'default-store';

async function readJson(relativePath) {
    const absolutePath = path.join(process.cwd(), relativePath);
    const raw = await fs.readFile(absolutePath, 'utf-8');
    return JSON.parse(raw);
}

async function seedDefaultStore() {
    const storeData = await readJson('pages/api/store.json');

    const store = await prisma.store.upsert({
        where: {id: DEFAULT_STORE_KEY},
        update: {name: 'Default Store'},
        create: {
            id: DEFAULT_STORE_KEY,
            name: 'Default Store',
        },
    });

    const weekdays = Array.from({length: 7}, (_, dayIndex) => dayIndex);

    await Promise.all(weekdays.map((dayIndex) => prisma.storeBusinessHour.upsert({
        where: {
            storeId_dayIndex: {
                storeId: store.id,
                dayIndex,
            },
        },
        update: {
            openTime: storeData.businessHours.start,
            closeTime: storeData.businessHours.end,
            enabled: true,
        },
        create: {
            storeId: store.id,
            dayIndex,
            openTime: storeData.businessHours.start,
            closeTime: storeData.businessHours.end,
            enabled: true,
        },
    })));

    await prisma.storeClosedDate.deleteMany({
        where: {storeId: store.id},
    });

    if (Array.isArray(storeData.closedDates) && storeData.closedDates.length > 0) {
        await prisma.storeClosedDate.createMany({
            data: storeData.closedDates.map((date) => ({
                storeId: store.id,
                date: new Date(`${date}T00:00:00`),
            })),
        });
    }

    await prisma.storePointSettings.upsert({
        where: {storeId: store.id},
        update: {
            enableServiceRate: !!storeData.pointSettings.enableServiceRate,
            enableRecharge: !!storeData.pointSettings.enableRecharge,
            serviceRate: Number(storeData.pointSettings.serviceRate ?? 0),
            rechargeRulesJson: storeData.pointSettings.rechargeRules ?? [],
        },
        create: {
            storeId: store.id,
            enableServiceRate: !!storeData.pointSettings.enableServiceRate,
            enableRecharge: !!storeData.pointSettings.enableRecharge,
            serviceRate: Number(storeData.pointSettings.serviceRate ?? 0),
            rechargeRulesJson: storeData.pointSettings.rechargeRules ?? [],
        },
    });

    console.log(`[seed] Default store seeded: ${store.id}`);
}

async function main() {
    await seedDefaultStore();
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
