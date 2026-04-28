import type {Reservation} from '../../../utils/reservations';

export interface ReservationCluster {
    id: string;
    reservations: Reservation[];
    startMinutes: number;
    endMinutes: number;
}

export type TimelineEntry =
    | { kind: 'single'; reservation: Reservation }
    | { kind: 'cluster'; cluster: ReservationCluster };

function toMinutes(time: string): number {
    const [hour, minute] = time.split(':').map(Number);
    return (hour * 60) + minute;
}

export function buildTimelineEntries(reservations: Reservation[]): TimelineEntry[] {
    const sorted = [...reservations].sort((a, b) => (
        a.startTime.localeCompare(b.startTime) ||
        a.endTime.localeCompare(b.endTime) ||
        a.id - b.id
    ));
    const entries: TimelineEntry[] = [];
    let current: Reservation[] = [];
    let currentStart = 0;
    let currentEnd = 0;

    const flush = () => {
        if (current.length === 0) return;

        if (current.length > 1) {
            entries.push({
                kind: 'cluster',
                cluster: {
                    id: `${current[0].date}-${currentStart}-${currentEnd}-${current.map((reservation) => reservation.id).join('-')}`,
                    reservations: current,
                    startMinutes: currentStart,
                    endMinutes: currentEnd,
                }
            });
        } else {
            current.forEach((reservation) => {
                entries.push({kind: 'single', reservation});
            });
        }

        current = [];
        currentStart = 0;
        currentEnd = 0;
    };

    sorted.forEach((reservation) => {
        const startMinutes = toMinutes(reservation.startTime);
        const endMinutes = toMinutes(reservation.endTime);

        if (current.length === 0) {
            current = [reservation];
            currentStart = startMinutes;
            currentEnd = endMinutes;
            return;
        }

        if (startMinutes < currentEnd) {
            current.push(reservation);
            currentStart = Math.min(currentStart, startMinutes);
            currentEnd = Math.max(currentEnd, endMinutes);
            return;
        }

        flush();
        current = [reservation];
        currentStart = startMinutes;
        currentEnd = endMinutes;
    });

    flush();

    return entries;
}
