import type {Customer} from '../utils/customers';
import type {Designer} from '../utils/designers';
import type {ServiceItem} from '../utils/services';
import type {StoreSettings} from '../utils/storeSettings';
import type {ReservationHistoryEntry, ReservationMap} from '../utils/reservations';
import {
    flattenReservationMap,
    shouldUseLocalDb,
    updateLocalDbSnapshot,
} from '../lib/local-db';

export function syncServiceSettings(services: ServiceItem[], categoryBaseColors: Record<string, string>): void {
    if (shouldUseLocalDb()) {
        updateLocalDbSnapshot((current) => ({
            ...current,
            services,
            categoryBaseColors,
        }));
        return;
    }

    fetch('/api/services', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({services, categoryBaseColors})
    }).catch(() => {
        // Preserve local UX even if sync fails; server data can be retried later.
    });
}

export function syncDesignerSettings(designers: Designer[]): void {
    if (shouldUseLocalDb()) {
        updateLocalDbSnapshot((current) => ({
            ...current,
            designers,
        }));
        return;
    }

    fetch('/api/designers', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({designers})
    }).catch(() => {
        // Preserve local UX even if sync fails; server data can be retried later.
    });
}

export function syncCustomerSettings(customers: Customer[]): void {
    if (shouldUseLocalDb()) {
        updateLocalDbSnapshot((current) => ({
            ...current,
            customers,
        }));
        return;
    }

    fetch('/api/customers', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({customers})
    }).catch(() => {
        // Preserve local UX even if sync fails; server data can be retried later.
    });
}

export function syncStoreSettings(storeSettings: StoreSettings): void {
    if (shouldUseLocalDb()) {
        updateLocalDbSnapshot((current) => ({
            ...current,
            storeSettings,
        }));
        return;
    }

    fetch('/api/store', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(storeSettings)
    }).catch(() => {
        // Preserve local UX even if sync fails; server data can be retried later.
    });
}

export function syncReservationState(reservationMap: ReservationMap, history: ReservationHistoryEntry[]): void {
    if (!shouldUseLocalDb()) {
        return;
    }

    updateLocalDbSnapshot((current) => ({
        ...current,
        reservations: flattenReservationMap(reservationMap),
        history,
    }));
}

export function groupCatalogByCategory(serviceCatalog: ServiceItem[]): Map<string, ServiceItem[]> {
    const grouped = new Map<string, ServiceItem[]>();

    for (const item of serviceCatalog) {
        const group = grouped.get(item.category);

        if (group) {
            group.push(item);
        } else {
            grouped.set(item.category, [item]);
        }
    }

    return grouped;
}

export function reorder<T>(list: T[], fromIndex: number, targetIndex: number): T[] {
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    const insertIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
    next.splice(insertIndex, 0, moved);
    return next;
}
