import type {DaySchedule, Designer, DesignerStatus} from '../utils/designers';
import {createDefaultSchedule, getDesignerColor} from '../utils/designers';

export function buildAddedDesignerState(
    designers: Designer[],
    name: string,
    status: DesignerStatus = '재직',
    phone = '',
    note = '',
    color?: string
) {
    const cleanName = name.trim();
    if (!cleanName) {
        return null;
    }

    const designerId = Date.now();
    const nextDesigner: Designer = {
        id: designerId,
        name: cleanName,
        schedule: createDefaultSchedule(),
        status,
        phone,
        note,
        color: color || getDesignerColor({id: designerId}),
    };

    return [...designers, nextDesigner];
}

export function buildUpdatedDesignerState(
    designers: Designer[],
    designerId: number,
    patch: Partial<Pick<Designer, 'name' | 'status' | 'phone' | 'note' | 'color'>>
) {
    return designers.map((designer) =>
        designer.id === designerId
            ? {
                ...designer,
                ...(patch.name !== undefined ? {name: patch.name} : {}),
                ...(patch.status ? {status: patch.status} : {}),
                ...(patch.phone !== undefined ? {phone: patch.phone} : {}),
                ...(patch.note !== undefined ? {note: patch.note} : {}),
                ...(patch.color !== undefined ? {color: patch.color} : {}),
            }
            : designer
    );
}

export function buildUpdatedDesignerDayState(
    designers: Designer[],
    designerId: number,
    dayIndex: number,
    patch: Partial<DaySchedule>
) {
    if (dayIndex < 0 || dayIndex > 6) {
        return null;
    }

    return designers.map((designer) => {
        if (designer.id !== designerId) return designer;

        const nextSchedule = designer.schedule.map((day, index) =>
            index === dayIndex ? {...day, ...patch} : day
        );

        return {...designer, schedule: nextSchedule};
    });
}

export function buildDeletedDesignerState(designers: Designer[], designerId: number) {
    return designers.filter((designer) => designer.id !== designerId);
}
