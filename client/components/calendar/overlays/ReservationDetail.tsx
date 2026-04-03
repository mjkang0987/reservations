import {useState} from 'react';

import {createPortal} from 'react-dom';

import {useCalendarStore} from '../../../store/calendarStore';

import type {Reservation, ReservationHistoryEntry, ReservationMap, ReservationStatus} from '../../../utils/reservations';
import {findOverlap} from '../../../utils/reservations';
import type {CustomerMap} from '../../../utils/customers';
import {splitDesignersByStatus} from '../../../utils/designers';
import {
    parseServiceString,
    joinServiceNames,
    sumDurationMinutes,
    sumPrice,
    formatPrice,
    calcEndTime,
} from '../../../utils/services';

import {
    StyledOverlay,
    StyledDetail,
    StyledHeader,
    StyledBody,
    StyledActionButton,
} from './ModalStyles';
import {
    ReservationDiffSection,
    ReservationEditSection,
    ReservationFooter,
    ReservationHistoryLayer,
    ReservationStaticDiffSection,
    ReservationViewSection,
    type ReservationDetailFormState,
} from './ReservationDetailSections';

type Mode = 'view' | 'editing' | 'confirming' | 'pastConfirm' | 'noChanges' | 'cancelling' | 'noshow';

const MODE_LABELS: Partial<Record<Mode, string>> = {
    editing: '예약 수정',
    confirming: '변경 확인',
    pastConfirm: '변경 확인',
    noChanges: '알림',
    cancelling: '예약 취소',
    noshow: '노쇼 처리',
};

interface ReservationDetailProps {
    reservation: Reservation;
    customerMap: CustomerMap;
    reservationMap: ReservationMap;
    history: ReservationHistoryEntry[];
    onClose: () => void;
    onCustomerClick: (customerId: number) => void;
    onUpdate: (prev: Reservation, updated: Reservation) => void;
    onCancel: (reservation: Reservation, status?: ReservationStatus) => void;
}

const FIELD_LABELS: Record<keyof ReservationDetailFormState, string> = {
    service: '시술',
    designerId: '디자이너',
    date: '날짜',
    startTime: '시작시간',
    endTime: '종료시간',
    price: '가격',
    memo: '메모'
};

const getChangedFields = (before: Reservation, after: ReservationDetailFormState, designerNameMap: Record<number, string>) => {
    const fields: { label: string; before: string; after: string }[] = [];
    const beforePrice = before.price ?? sumPrice(parseServiceString(before.service));

    (Object.keys(FIELD_LABELS) as (keyof ReservationDetailFormState)[]).forEach((key) => {
        if (key === 'designerId') {
            const beforeDesignerId = before.designerId ?? 0;
            if (beforeDesignerId !== after.designerId) {
                fields.push({
                    label: FIELD_LABELS[key],
                    before: designerNameMap[beforeDesignerId] ?? '-',
                    after: designerNameMap[after.designerId] ?? '-'
                });
            }
        } else if (key === 'price') {
            if (beforePrice !== after.price) {
                fields.push({
                    label: FIELD_LABELS[key],
                    before: formatPrice(beforePrice),
                    after: formatPrice(after.price)
                });
            }
        } else if (before[key] !== after[key]) {
            fields.push({
                label: FIELD_LABELS[key],
                before: before[key] as string,
                after: after[key] as string
            });
        }
    });

    return fields;
};

const getHistoryDiffs = (entry: ReservationHistoryEntry, designerNameMap: Record<number, string>) => {
    const diffs: { label: string; before: string; after: string }[] = [];

    if (entry.after.status === 'cancelled' && entry.before.status !== 'cancelled') {
        diffs.push({label: '상태', before: '활성', after: '취소됨'});
        return diffs;
    }

    if (entry.after.status === 'noshow' && entry.before.status !== 'noshow') {
        diffs.push({label: '상태', before: '활성', after: '노쇼'});
        return diffs;
    }

    (Object.keys(FIELD_LABELS) as (keyof ReservationDetailFormState)[]).forEach((key) => {
        if (key === 'designerId') {
            const beforeDesignerId = entry.before.designerId ?? 0;
            const afterDesignerId = entry.after.designerId ?? 0;
            if (beforeDesignerId !== afterDesignerId) {
                diffs.push({
                    label: FIELD_LABELS[key],
                    before: designerNameMap[beforeDesignerId] ?? '-',
                    after: designerNameMap[afterDesignerId] ?? '-'
                });
            }
        } else if (key === 'price') {
            const beforePrice = entry.before.price ?? sumPrice(parseServiceString(entry.before.service));
            const afterPrice = entry.after.price ?? sumPrice(parseServiceString(entry.after.service));
            if (beforePrice !== afterPrice) {
                diffs.push({
                    label: FIELD_LABELS[key],
                    before: formatPrice(beforePrice),
                    after: formatPrice(afterPrice)
                });
            }
        } else if (entry.before[key] !== entry.after[key]) {
            diffs.push({
                label: FIELD_LABELS[key],
                before: entry.before[key] as string,
                after: entry.after[key] as string
            });
        }
    });

    return diffs;
};

const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ReservationDetail = ({
                                      reservation,
                                      customerMap,
                                      reservationMap,
                                      history,
                                      onClose,
                                      onCustomerClick,
                                      onUpdate,
                                      onCancel
                                  }: ReservationDetailProps) => {
    const customer = customerMap[reservation.customerId];
    const designers = useCalendarStore((s) => s.designers);
    const {
        active: activeDesigners,
        onLeave: onLeaveDesigners,
        resigned: resignedDesigners
    } = splitDesignersByStatus(designers);
    const selectableDesigners = [...activeDesigners, ...onLeaveDesigners, ...resignedDesigners];
    const designerNameMap = designers.reduce<Record<number, string>>((acc, designer) => {
        acc[designer.id] = designer.name;
        return acc;
    }, {});
    const modalRoot = document.getElementById('modal-root');

    const [mode, setMode] = useState<Mode>('view');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const initialPrice = reservation.price ?? sumPrice(parseServiceString(reservation.service));
    const initialDesignerId = reservation.designerId ?? (selectableDesigners[0]?.id ?? 0);
    const [form, setForm] = useState<ReservationDetailFormState>({
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        service: reservation.service,
        designerId: initialDesignerId,
        price: initialPrice,
        memo: reservation.memo ?? ''
    });
    const [error, setError] = useState('');
    const [selectedServices, setSelectedServices] = useState<string[]>(
        () => parseServiceString(reservation.service)
    );
    const [isEndTimeManual, setIsEndTimeManual] = useState(false);
    const [isPriceManual, setIsPriceManual] = useState(false);

    const changedFields = getChangedFields(reservation, form, designerNameMap);
    const thisHistory = history.filter((h) => h.reservationId === reservation.id);
    const totalDuration = sumDurationMinutes(selectedServices);
    const totalPrice = sumPrice(selectedServices);
    const displayPrice = reservation.price ?? sumPrice(parseServiceString(reservation.service));
    const displayDesignerName = reservation.designerId ? (designerNameMap[reservation.designerId] ?? '-') : '-';

    const handleChange = (field: keyof ReservationDetailFormState, value: string) => {
        setForm((prev) => ({...prev, [field]: value}));
        setError('');
    };

    const handleStartTimeChange = (value: string) => {
        setForm((prev) => {
            const next = {...prev, startTime: value};

            if (!isEndTimeManual && selectedServices.length > 0) {
                const duration = sumDurationMinutes(selectedServices);

                if (duration > 0) {
                    next.endTime = calcEndTime(value, duration);
                }
            }

            return next;
        });
        setError('');
    };

    const handleEndTimeChange = (value: string) => {
        setIsEndTimeManual(true);
        setForm((prev) => ({...prev, endTime: value}));
        setError('');
    };

    const handleServiceToggle = (serviceName: string) => {
        setSelectedServices((prev) => {
            const next = prev.includes(serviceName)
                ? prev.filter((s) => s !== serviceName)
                : [...prev, serviceName];

            const serviceStr = joinServiceNames(next);
            const duration = sumDurationMinutes(next);

            setForm((f) => {
                const updated = {...f, service: serviceStr};

                if (duration > 0) {
                    updated.endTime = calcEndTime(f.startTime, duration);
                }

                if (!isPriceManual) {
                    updated.price = sumPrice(next);
                }

                return updated;
            });

            setIsEndTimeManual(false);
            setError('');

            return next;
        });
    };

    const validateForm = (): string => {
        if (selectableDesigners.length > 0 && !form.designerId) return '디자이너를 선택해주세요.';
        if (!form.service.trim()) return '시술을 선택해주세요.';
        if (!form.date) return '날짜를 선택해주세요.';
        if (!form.startTime) return '시작 시간을 입력해주세요.';
        if (!form.endTime) return '종료 시간을 입력해주세요.';
        if (form.startTime >= form.endTime) return '시작 시간은 종료 시간보다 앞서야 합니다.';

        const overlap = findOverlap(reservationMap, form.date, form.startTime, form.endTime, reservation.id);

        if (overlap) {
            const name = customerMap[overlap.customerId]?.name ?? '-';
            return `${name} 예약(${overlap.startTime}~${overlap.endTime})과 시간이 겹칩니다.`;
        }

        return '';
    };

    const isPastTime = () => {
        const now = new Date();
        const startDateTime = new Date(`${form.date}T${form.startTime}`);
        return startDateTime < now;
    };

    const handleConfirmRequest = () => {
        const msg = validateForm();
        if (msg) {
            setError(msg);
            return;
        }
        if (changedFields.length === 0) {
            setMode('noChanges');
            return;
        }
        setError('');
        if (isPastTime()) {
            setMode('pastConfirm');
            return;
        }
        setMode('confirming');
    };

    const handleConfirmSave = () => {
        onUpdate(reservation, {...reservation, ...form});
        setMode('view');
    };

    const handleCancel = () => {
        setForm({
            date: reservation.date,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            service: reservation.service,
            designerId: initialDesignerId,
            price: initialPrice,
            memo: reservation.memo ?? ''
        });
        setSelectedServices(parseServiceString(reservation.service));
        setIsEndTimeManual(false);
        setIsPriceManual(false);
        setIsHistoryOpen(false);
        setMode('view');
    };

    const handleBack = () => {
        if (isHistoryOpen) {
            setIsHistoryOpen(false);
            return;
        }

        if (mode === 'confirming' || mode === 'pastConfirm' || mode === 'noChanges') {
            setMode('editing');
        } else if (mode === 'editing' || mode === 'cancelling' || mode === 'noshow') {
            handleCancel();
        } else {
            onClose();
        }
    };

    const isCancelled = reservation.status === 'cancelled';
    const isNoshow = reservation.status === 'noshow';
    const isInactive = isCancelled || isNoshow;
    const dialogLabel = MODE_LABELS[mode] ?? '예약 상세';
    const dialogTitle = MODE_LABELS[mode] ?? `${reservation.service} - ${customer?.name}`;
    const footerActions = mode === 'view'
        ? (!isInactive ? (
            <>
                <StyledActionButton type="button"
                                    $danger
                                    onClick={() => setMode('cancelling')}>예약취소</StyledActionButton>
                <StyledActionButton type="button"
                                    $warning
                                    onClick={() => setMode('noshow')}>노쇼</StyledActionButton>
                <StyledActionButton type="button"
                                    $primary
                                    onClick={() => setMode('editing')}>수정</StyledActionButton>
            </>
        ) : null)
        : mode === 'editing'
            ? (
                <>
                    <StyledActionButton type="button"
                                        onClick={handleCancel}>취소</StyledActionButton>
                    <StyledActionButton type="button"
                                        $primary
                                        onClick={handleConfirmRequest}>저장</StyledActionButton>
                </>
            )
            : mode === 'confirming'
                ? (
                    <>
                        <StyledActionButton type="button"
                                            onClick={() => setMode('editing')}>돌아가기</StyledActionButton>
                        <StyledActionButton type="button"
                                            $primary
                                            onClick={handleConfirmSave}>확인</StyledActionButton>
                    </>
                )
                : mode === 'noChanges'
                    ? (
                        <StyledActionButton type="button"
                                            $primary
                                            onClick={() => setMode('editing')}>확인</StyledActionButton>
                    )
                    : mode === 'pastConfirm'
                        ? (
                            <>
                                <StyledActionButton type="button"
                                                    onClick={() => setMode('editing')}>아니오</StyledActionButton>
                                <StyledActionButton type="button"
                                                    $primary
                                                    onClick={handleConfirmSave}>네</StyledActionButton>
                            </>
                        )
                        : mode === 'cancelling'
                            ? (
                                <>
                                    <StyledActionButton type="button"
                                                        onClick={() => setMode('view')}>돌아가기</StyledActionButton>
                                    <StyledActionButton type="button"
                                                        $danger
                                                        onClick={() => onCancel(reservation)}>예약취소</StyledActionButton>
                                </>
                            )
                            : mode === 'noshow'
                                ? (
                                    <>
                                        <StyledActionButton type="button"
                                                            onClick={() => setMode('view')}>돌아가기</StyledActionButton>
                                        <StyledActionButton type="button"
                                                            $warning
                                                            onClick={() => onCancel(reservation, 'noshow')}>노쇼 처리</StyledActionButton>
                                    </>
                                )
                                : null;

    if (!modalRoot) return null;

    return createPortal(<StyledOverlay onClick={handleBack}
                                       role="dialog"
                                       aria-modal="true"
                                       aria-label={dialogLabel}>
        <StyledDetail onClick={(e) => e.stopPropagation()}
                      $width={400}>
            <StyledHeader>
                <h3>{dialogTitle}</h3>
                <button type="button"
                        onClick={handleBack}
                        aria-label="닫기">&#x2715;</button>
            </StyledHeader>

            {mode === 'view' && (
                <ReservationViewSection
                    reservation={reservation}
                    customerMap={customerMap}
                    displayPrice={displayPrice}
                    displayDesignerName={displayDesignerName}
                    historyCount={thisHistory.length}
                    onCustomerClick={onCustomerClick}
                    onOpenHistory={() => setIsHistoryOpen(true)}
                />
            )}

            {mode === 'editing' && (
                <ReservationEditSection
                    form={form}
                    error={error}
                    selectableDesigners={selectableDesigners}
                    activeDesigners={activeDesigners}
                    onLeaveDesigners={onLeaveDesigners}
                    resignedDesigners={resignedDesigners}
                    selectedServices={selectedServices}
                    totalDuration={totalDuration}
                    totalPrice={totalPrice}
                    onServiceToggle={handleServiceToggle}
                    onPriceChange={(value) => {
                        const raw = value.replace(/[^0-9]/g, '');
                        const num = raw === '' ? 0 : parseInt(raw, 10);
                        setForm((f) => ({...f, price: num}));
                        setIsPriceManual(true);
                        setError('');
                    }}
                    onDesignerChange={(designerId) => {
                        setForm((prev) => ({...prev, designerId}));
                        setError('');
                    }}
                    onFieldChange={handleChange}
                    onStartTimeChange={handleStartTimeChange}
                    onEndTimeChange={handleEndTimeChange}
                />
            )}

            {mode === 'confirming' && (
                <ReservationDiffSection message="수정하시겠습니까?" diffs={changedFields} />
            )}

            {mode === 'noChanges' && (
                <ReservationDiffSection message="변경내역이 없습니다." diffs={[]} />
            )}

            {mode === 'pastConfirm' && (
                <ReservationDiffSection
                    message="현재 시간보다 과거입니다. 변경하시겠습니까?"
                    color="var(--caution-color)"
                    diffs={changedFields}
                />
            )}

            {mode === 'cancelling' && (
                <ReservationStaticDiffSection
                    message="이 예약을 취소하시겠습니까?"
                    color="var(--danger-color)"
                    items={[
                        {label: '시술', value: reservation.service},
                        {label: '날짜', value: reservation.date},
                        {label: '시간', value: `${reservation.startTime} ~ ${reservation.endTime}`},
                        {label: '고객명', value: customer?.name ?? '-'},
                    ]}
                />
            )}

            {mode === 'noshow' && (
                <ReservationStaticDiffSection
                    message="이 예약을 노쇼 처리하시겠습니까?"
                    color="var(--warning-color)"
                    items={[
                        {label: '시술', value: reservation.service},
                        {label: '날짜', value: reservation.date},
                        {label: '시간', value: `${reservation.startTime} ~ ${reservation.endTime}`},
                        {label: '고객명', value: customer?.name ?? '-'},
                    ]}
                />
            )}

            <ReservationFooter actions={footerActions} />
        </StyledDetail>
        <ReservationHistoryLayer
            history={thisHistory}
            designerNameMap={designerNameMap}
            getHistoryDiffs={getHistoryDiffs}
            formatTimestamp={formatTimestamp}
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
        />
    </StyledOverlay>, modalRoot);
};
