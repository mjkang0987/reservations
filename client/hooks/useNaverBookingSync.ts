import {useCallback, useEffect, useRef, useState} from 'react';

import {useSession} from 'next-auth/react';

import {useCalendarStore} from '../store/calendarStore';
import {groupByDate} from '../utils/reservations';
import {toCustomerMap} from '../utils/customers';
import type {Reservation, ReservationHistoryEntry} from '../utils/reservations';
import type {Customer} from '../utils/customers';
import type {Designer} from '../utils/designers';

export interface ConflictInfo {
    newReservation: Reservation;
    existingReservation: Reservation;
}

export interface SyncNotification {
    id: string;
    bookingId: string;
    customerName: string;
    designerName: string;
    appointmentDate: string;
    appointmentTime: string;
    reservationId: number;
    timestamp: Date;
    read: boolean;
    type?: 'sync' | 'cancel' | 'conflict';
    conflictKey?: string;
    conflictStatus?: 'pending' | 'deferred' | 'confirmed';
}

interface SyncedEntry {
    bookingId: string;
    customerName: string;
    designerName: string;
    appointmentDate: string;
    appointmentTime: string;
    reservationId: number;
}

interface CancelledEntry {
    bookingId: string;
    reservationId: number;
}

function conflictKey(c: ConflictInfo): string {
    return `${c.newReservation.id}-${c.existingReservation.id}`;
}

export function useNaverBookingSync() {
    const {data: session} = useSession();
    const isSyncingRef = useRef(false);
    const [syncing, setSyncing] = useState(false);
    const [conflictQueue, setConflictQueue] = useState<ConflictInfo[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [deferredIds, setDeferredIds] = useState<Set<string>>(() => {
        if (typeof window === 'undefined') return new Set();
        const stored = localStorage.getItem('naver-sync-deferred-conflicts');
        return stored ? new Set(JSON.parse(stored)) : new Set();
    });

    const notifications = useCalendarStore((s) => s.syncNotifications);
    const addSyncNotifications = useCalendarStore((s) => s.addSyncNotifications);
    const markSyncNotificationRead = useCalendarStore((s) => s.markSyncNotificationRead);
    const markSyncNotificationsRead = useCalendarStore((s) => s.markSyncNotificationsRead);
    const updateConflictNotificationStatus = useCalendarStore((s) => s.updateConflictNotificationStatus);
    const replaceMockConflictNotifications = useCalendarStore((s) => s.replaceMockConflictNotifications);
    const clearSyncNotifications = useCalendarStore((s) => s.clearSyncNotifications);
    const reservationMap = useCalendarStore((s) => s.reservationMap);
    const testModeDetectedRef = useRef(false);

    // 테스트 모드 자동 중복 감지
    useEffect(() => {
        if (testModeDetectedRef.current) return;

        const reservationDates = Object.keys(reservationMap);
        if (reservationDates.length === 0) return;

        let cancelled = false;

        fetch('/api/test-mode')
            .then((res) => res.ok ? res.json() as Promise<{testMode: boolean}> : null)
            .then((data) => {
                if (cancelled || !data?.testMode) return;
                testModeDetectedRef.current = true;

                const detected = detectConflictsFromStore();
                if (detected.length === 0) return;

                const customerMap = useCalendarStore.getState().customerMap;
                const designers = useCalendarStore.getState().designers;

                const conflictNotifications: SyncNotification[] = detected.map((conflict, index) => ({
                    id: `test-conflict-${conflict.newReservation.id}-${index}`,
                    bookingId: String(conflict.newReservation.naverBookingId ?? conflict.newReservation.id),
                    customerName: customerMap[conflict.newReservation.customerId]?.name ?? `고객 ${conflict.newReservation.customerId}`,
                    designerName: designers.find((designer) => designer.id === conflict.newReservation.designerId)?.name ?? '미지정',
                    appointmentDate: conflict.newReservation.date,
                    appointmentTime: conflict.newReservation.startTime,
                    reservationId: conflict.newReservation.id,
                    timestamp: new Date(),
                    read: false,
                    type: 'conflict' as const,
                    conflictKey: conflictKey(conflict),
                    conflictStatus: 'pending' as const,
                }));

                if (conflictNotifications.length > 0) {
                    replaceMockConflictNotifications(conflictNotifications);
                }

                setConflictQueue(detected);
                setCurrentIndex(0);
            })
            .catch(() => {});

        return () => { cancelled = true; };
    }, [reservationMap, replaceMockConflictNotifications]);

    const isActive =
        session?.user?.provider === 'google'
        && (session.user.role === 'manager' || session.user.role === 'owner')
        && !!session.user.storeId;

    const sync = useCallback(async () => {
        if (!isActive) return;
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        setSyncing(true);

        try {
            const res = await fetch('/api/naver-booking-sync', {method: 'POST'});
            if (!res.ok) return;

            const data = await res.json() as {
                synced: SyncedEntry[];
                cancelled: CancelledEntry[];
                skipped: string[];
                errors: string[];
                error?: string;
            };

            if (data.error === 'gmail_not_connected') return;

            localStorage.setItem('naver-sync-last', String(Date.now()));
            console.log('[naver-sync]', {synced: data.synced.length, cancelled: data.cancelled.length, skipped: data.skipped.length, errors: data.errors.length});

            if (data.synced.length === 0 && data.cancelled.length === 0 && data.errors.length === 0) return;

            const now = new Date();
            const newNotifications: SyncNotification[] = data.synced.map((entry, i) => ({
                id: `${Date.now()}-sync-${i}`,
                bookingId: entry.bookingId,
                customerName: entry.customerName,
                designerName: entry.designerName,
                appointmentDate: entry.appointmentDate,
                appointmentTime: entry.appointmentTime,
                reservationId: entry.reservationId,
                timestamp: now,
                read: false,
            }));

            const cancelNotifications: SyncNotification[] = data.cancelled.map((entry, i) => ({
                id: `${Date.now()}-cancel-${i}`,
                bookingId: entry.bookingId,
                customerName: '',
                designerName: '',
                appointmentDate: '',
                appointmentTime: '',
                reservationId: entry.reservationId,
                timestamp: now,
                read: false,
                type: 'cancel' as const,
            }));

            const allNotifications = [...newNotifications, ...cancelNotifications];
            if (allNotifications.length > 0) {
                console.log('[naver-sync] adding notifications:', allNotifications.length);
                addSyncNotifications(allNotifications);
            }

            if (data.synced.length > 0 || data.cancelled.length > 0) {
                await reloadStoreData();
                if (data.synced.length > 0) {
                    const detected = detectConflicts(data.synced);
                    if (detected.length > 0) {
                        const customerMap = useCalendarStore.getState().customerMap;
                        const designers = useCalendarStore.getState().designers;
                        const existingKeys = new Set(
                            useCalendarStore.getState().syncNotifications
                                .filter((notification) => notification.type === 'conflict')
                                .map((notification) => notification.conflictKey)
                        );
                        const conflictNotifications = detected
                            .filter((conflict) => !existingKeys.has(conflictKey(conflict)))
                            .map((conflict, index) => ({
                            id: `${Date.now()}-conflict-${index}`,
                            bookingId: String(conflict.newReservation.naverBookingId ?? conflict.newReservation.id),
                            customerName: customerMap[conflict.newReservation.customerId]?.name ?? '',
                            designerName: designers.find((designer) => designer.id === conflict.newReservation.designerId)?.name ?? '미지정',
                            appointmentDate: conflict.newReservation.date,
                            appointmentTime: conflict.newReservation.startTime,
                            reservationId: conflict.newReservation.id,
                            timestamp: now,
                            read: false,
                            type: 'conflict' as const,
                            conflictKey: conflictKey(conflict),
                            conflictStatus: 'pending' as const,
                        }));
                        if (conflictNotifications.length > 0) {
                            addSyncNotifications(conflictNotifications);
                        }
                        setConflictQueue(detected);
                        setCurrentIndex(0);
                    }
                }
            }
        } catch {
            // Silently ignore network errors
        } finally {
            isSyncingRef.current = false;
            setSyncing(false);
        }
    }, [isActive]);

    // 자동 동기화: 로그인 시 + 매 정시 (마지막 동기화 후 30분 이내면 건너뜀)
    useEffect(() => {
        if (!isActive) return;

        const shouldSync = () => {
            const last = Number(localStorage.getItem('naver-sync-last') || '0');
            return Date.now() - last >= 30 * 60 * 1000;
        };

        const autoSync = () => {
            if (shouldSync()) sync();
        };

        // 로그인 시
        autoSync();

        // 매 정시
        const msUntilNextHour = () => {
            const now = new Date();
            const next = new Date(now);
            next.setHours(next.getHours() + 1, 0, 0, 0);
            return next.getTime() - now.getTime();
        };

        let intervalId: ReturnType<typeof setInterval> | null = null;

        const timerId = setTimeout(() => {
            autoSync();
            intervalId = setInterval(autoSync, 60 * 60 * 1000);
        }, msUntilNextHour());

        return () => {
            clearTimeout(timerId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [isActive, sync]);


    const visibleNotifications = notifications;
    const unreadCount = visibleNotifications.filter((n) => !n.read).length;

    const activeQueue = conflictQueue.filter((c) => !deferredIds.has(conflictKey(c)));
    const currentConflict: ConflictInfo | null = activeQueue[currentIndex] ?? null;

    const advanceConflict = useCallback(() => {
        if (currentConflict) {
            updateConflictNotificationStatus(conflictKey(currentConflict), 'confirmed');
        }
        setCurrentIndex((prev) => {
            const nextIndex = prev + 1;
            if (nextIndex >= activeQueue.length) {
                setConflictQueue([]);
                return 0;
            }
            return nextIndex;
        });
    }, [activeQueue.length, currentConflict, updateConflictNotificationStatus]);

    const deferConflict = useCallback(() => {
        if (!currentConflict) return;
        const key = conflictKey(currentConflict);
        updateConflictNotificationStatus(key, 'deferred');
        setDeferredIds((prev) => {
            const next = new Set(prev);
            next.add(key);
            localStorage.setItem('naver-sync-deferred-conflicts', JSON.stringify([...next]));
            return next;
        });
        // After deferring, the activeQueue shrinks so currentIndex now points to the next item.
        // If currentIndex is now at or past the end of the (now-shorter) queue, reset.
        setCurrentIndex((prev) => {
            const newActiveLength = activeQueue.length - 1;
            if (newActiveLength <= 0) {
                setConflictQueue([]);
                return 0;
            }
            return prev >= newActiveLength ? 0 : prev;
        });
    }, [currentConflict, activeQueue.length, updateConflictNotificationStatus]);

    const openConflictByKey = useCallback((key: string) => {
        const existing = conflictQueue.find((conflict) => conflictKey(conflict) === key);
        if (!existing) return;

        setDeferredIds((prev) => {
            if (!prev.has(key)) return prev;
            const next = new Set(prev);
            next.delete(key);
            localStorage.setItem('naver-sync-deferred-conflicts', JSON.stringify([...next]));
            return next;
        });

        const nextActiveQueue = conflictQueue.filter((conflict) => {
            const itemKey = conflictKey(conflict);
            return itemKey === key || !deferredIds.has(itemKey);
        });
        const nextIndex = nextActiveQueue.findIndex((conflict) => conflictKey(conflict) === key);
        setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
        updateConflictNotificationStatus(key, 'pending');
    }, [conflictQueue, deferredIds, updateConflictNotificationStatus]);

    return {
        notifications,
        visibleNotifications,
        unreadCount,
        markRead: markSyncNotificationRead,
        markAllRead: markSyncNotificationsRead,
        clearAll: clearSyncNotifications,
        currentConflict,
        advanceConflict,
        deferConflict,
        openConflictByKey,
        sync,
        syncing,
        isActive,
    };
}

function detectConflictsFromStore(): ConflictInfo[] {
    const reservationMap = useCalendarStore.getState().reservationMap;
    const conflicts: ConflictInfo[] = [];
    const seen = new Set<string>();

    for (const dateReservations of Object.values(reservationMap)) {
        const active = dateReservations.filter((r) => r.status !== 'cancelled' && r.status !== 'noshow');
        for (const a of active) {
            for (const b of active) {
                if (a.id >= b.id) continue;
                if (a.designerId == null || a.designerId !== b.designerId) continue;
                if (a.startTime >= b.endTime || a.endTime <= b.startTime) continue;

                const pairKey = `${a.id}-${b.id}`;
                if (seen.has(pairKey)) continue;
                seen.add(pairKey);

                const aIsNaver = !!a.naverBookingId;
                const bIsNaver = !!b.naverBookingId;
                const newRes = aIsNaver ? a : bIsNaver ? b : a;
                const existingRes = newRes === a ? b : a;

                conflicts.push({newReservation: newRes, existingReservation: existingRes});
            }
        }
    }

    return conflicts;
}

function detectConflicts(syncedEntries: SyncedEntry[]): ConflictInfo[] {
    const reservationMap = useCalendarStore.getState().reservationMap;
    const conflicts: ConflictInfo[] = [];

    for (const entry of syncedEntries) {
        const dateReservations = reservationMap[entry.appointmentDate] ?? [];
        const newRes = dateReservations.find((r) => r.id === entry.reservationId);
        if (!newRes) continue;

        const overlapping = dateReservations.find((r) =>
            r.id !== newRes.id
            && r.status !== 'cancelled'
            && r.status !== 'noshow'
            && (newRes.designerId == null || r.designerId === newRes.designerId)
            && newRes.startTime < r.endTime
            && newRes.endTime > r.startTime
        );

        if (overlapping) {
            conflicts.push({newReservation: newRes, existingReservation: overlapping});
        }
    }

    return conflicts;
}

async function reloadStoreData() {
    const setReservationMap = useCalendarStore.getState().setReservationMap;
    const setCustomerMap = useCalendarStore.getState().setCustomerMap;
    const setReservationHistory = useCalendarStore.getState().setReservationHistory;
    const setDesigners = useCalendarStore.getState().setDesigners;

    try {
        const [resRes, custRes, desRes] = await Promise.all([
            fetch('/api/reservations'),
            fetch('/api/customers'),
            fetch('/api/designers'),
        ]);

        if (resRes.ok) {
            const resData = await resRes.json() as {
                reservations: Reservation[];
                history: ReservationHistoryEntry[];
            };
            setReservationMap(groupByDate(resData.reservations));
            setReservationHistory(resData.history);
        }

        if (custRes.ok) {
            const custData = await custRes.json() as {customers: Customer[]};
            setCustomerMap(toCustomerMap(custData.customers));
        }

        if (desRes.ok) {
            const desData = await desRes.json() as {designers: Designer[]};
            setDesigners(desData.designers);
        }
    } catch {
        // Silently ignore reload errors
    }
}
