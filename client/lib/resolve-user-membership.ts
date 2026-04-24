import {prisma} from './prisma';

const ROLE_PRIORITY = {
    owner: 0,
    manager: 1,
    staff: 2,
} as const;

export async function resolveUserMembership(userId: string | null | undefined) {
    if (!process.env.DATABASE_URL || !userId) {
        return null;
    }

    const memberships = await prisma.membership.findMany({
        where: {userId},
        select: {
            role: true,
            storeId: true,
        },
    });

    if (memberships.length === 0) {
        return null;
    }

    return memberships
        .slice()
        .sort((left, right) => ROLE_PRIORITY[left.role] - ROLE_PRIORITY[right.role])[0];
}
