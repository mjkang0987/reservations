import type {Customer, CustomerMap} from '../customers/model';
import {toCustomerMap} from '../customers/model';
import type {Designer} from '../designers/model';
import {DEFAULT_DESIGNERS} from '../designers/model';
import type {Reservation, ReservationHistoryEntry, ReservationMap} from '../reservations/model';
import type {ServiceItem} from '../services/model';
import {CATEGORY_BASE_COLOR_MAP, SERVICE_CATALOG} from '../services/model';
import type {StoreSettings} from '../store-settings/model';
import {DEFAULT_STORE_SETTINGS} from '../store-settings/model';

const LOCAL_DB_KEY = 'takeaseat.local-db.v1';
const LOCAL_DB_EVENT = 'takeaseat-local-db-updated';

export interface LocalDbSnapshot {
    customers: Customer[];
    reservations: Reservation[];
    history: ReservationHistoryEntry[];
    services: ServiceItem[];
    categoryBaseColors: Record<string, string>;
    designers: Designer[];
    storeSettings: StoreSettings;
}

function cloneSnapshot(snapshot: LocalDbSnapshot): LocalDbSnapshot {
    return JSON.parse(JSON.stringify(snapshot)) as LocalDbSnapshot;
}

export function createDefaultLocalDbSnapshot(): LocalDbSnapshot {
    return cloneSnapshot({
        customers: [],
        reservations: [],
        history: [],
        services: SERVICE_CATALOG,
        categoryBaseColors: CATEGORY_BASE_COLOR_MAP,
        designers: DEFAULT_DESIGNERS,
        storeSettings: DEFAULT_STORE_SETTINGS,
    });
}

export function hasAuthSessionCookie(): boolean {
    if (typeof document === 'undefined') return false;

    return document.cookie.includes('authjs.session-token=')
        || document.cookie.includes('__Secure-authjs.session-token=');
}

export function shouldUseLocalDb(): boolean {
    return !hasAuthSessionCookie();
}

export function loadLocalDbSnapshot(): LocalDbSnapshot {
    if (typeof window === 'undefined') {
        return createDefaultLocalDbSnapshot();
    }

    const raw = window.localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
        const snapshot = createDefaultLocalDbSnapshot();
        saveLocalDbSnapshot(snapshot);
        return snapshot;
    }

    try {
        const parsed = JSON.parse(raw) as Partial<LocalDbSnapshot>;
        return {
            ...createDefaultLocalDbSnapshot(),
            ...parsed,
            categoryBaseColors: parsed.categoryBaseColors ?? CATEGORY_BASE_COLOR_MAP,
            storeSettings: parsed.storeSettings ?? DEFAULT_STORE_SETTINGS,
            designers: Array.isArray(parsed.designers) ? parsed.designers : DEFAULT_DESIGNERS,
            services: Array.isArray(parsed.services) ? parsed.services : SERVICE_CATALOG,
            customers: Array.isArray(parsed.customers) ? parsed.customers : [],
            reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
            history: Array.isArray(parsed.history) ? parsed.history : [],
        };
    } catch {
        const snapshot = createDefaultLocalDbSnapshot();
        saveLocalDbSnapshot(snapshot);
        return snapshot;
    }
}

export function saveLocalDbSnapshot(snapshot: LocalDbSnapshot): void {
    if (typeof window === 'undefined') return;

    const normalized = cloneSnapshot(snapshot);
    window.localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent<LocalDbSnapshot>(LOCAL_DB_EVENT, {detail: normalized}));
}

export function updateLocalDbSnapshot(updater: (current: LocalDbSnapshot) => LocalDbSnapshot): void {
    const current = loadLocalDbSnapshot();
    saveLocalDbSnapshot(updater(current));
}

export function subscribeLocalDb(listener: (snapshot: LocalDbSnapshot) => void): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const handleUpdate = (event: Event) => {
        const customEvent = event as CustomEvent<LocalDbSnapshot>;
        listener(customEvent.detail ?? loadLocalDbSnapshot());
    };

    const handleStorage = (event: StorageEvent) => {
        if (event.key === LOCAL_DB_KEY) {
            listener(loadLocalDbSnapshot());
        }
    };

    window.addEventListener(LOCAL_DB_EVENT, handleUpdate as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
        window.removeEventListener(LOCAL_DB_EVENT, handleUpdate as EventListener);
        window.removeEventListener('storage', handleStorage);
    };
}

export function flattenReservationMap(reservationMap: ReservationMap): Reservation[] {
    return Object.values(reservationMap).flat();
}

export function customerMapToList(customerMap: CustomerMap): Customer[] {
    return Object.values(customerMap);
}

export function customerListToMap(customers: Customer[]): CustomerMap {
    return toCustomerMap(customers);
}
