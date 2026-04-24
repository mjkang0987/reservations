import {PrismaClient} from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const DEFAULT_STORE_KEY = 'default-store';

function mapDesignerStatus(status) {
    if (status === '휴직') return 'on_leave';
    if (status === '퇴직') return 'resigned';
    return 'active';
}

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

async function seedDesigners() {
    const designerData = await readJson('pages/api/designers.json');

    const store = await prisma.store.findUnique({
        where: {id: DEFAULT_STORE_KEY},
        select: {id: true},
    });

    if (!store) {
        throw new Error('Default store must exist before seeding designers.');
    }

    for (const designer of designerData.designers ?? []) {
        const savedDesigner = await prisma.designer.upsert({
            where: {
                storeId_legacyId: {
                    storeId: store.id,
                    legacyId: designer.id,
                },
            },
            update: {
                name: designer.name,
                status: mapDesignerStatus(designer.status),
                phone: designer.phone ?? null,
                note: designer.note ?? null,
                color: designer.color ?? null,
            },
            create: {
                storeId: store.id,
                legacyId: designer.id,
                name: designer.name,
                status: mapDesignerStatus(designer.status),
                phone: designer.phone ?? null,
                note: designer.note ?? null,
                color: designer.color ?? null,
            },
        });

        for (const [dayIndex, schedule] of (designer.schedule ?? []).entries()) {
            await prisma.designerSchedule.upsert({
                where: {
                    designerId_dayIndex: {
                        designerId: savedDesigner.id,
                        dayIndex,
                    },
                },
                update: {
                    enabled: !!schedule.enabled,
                    startTime: schedule.start,
                    endTime: schedule.end,
                },
                create: {
                    designerId: savedDesigner.id,
                    dayIndex,
                    enabled: !!schedule.enabled,
                    startTime: schedule.start,
                    endTime: schedule.end,
                },
            });
        }
    }

    console.log(`[seed] Designers seeded: ${(designerData.designers ?? []).length}`);
}

async function main() {
    await seedDefaultStore();
    await seedDesigners();
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
