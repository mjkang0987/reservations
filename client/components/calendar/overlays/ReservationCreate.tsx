import {useState, useRef, useEffect} from 'react';

import {createPortal} from 'react-dom';

import styled from 'styled-components';

import {useCalendarStore} from '../../../store/calendarStore';
import type {CreateReservationInitial} from '../../../store/calendarStore';

import type {Reservation} from '../../../utils/reservations';
import {findOverlap} from '../../../utils/reservations';
import type {Customer, CustomerMap} from '../../../utils/customers';
import {splitDesignersByStatus} from '../../../utils/designers';

import {
    joinServiceNames,
    sumDurationMinutes,
    sumPrice,
    calcEndTime,
} from '../../../utils/services';

import {
    OVERLAY_Z_INDEX,
    StyledOverlay,
    StyledDetail,
    StyledHeader,
    StyledBody,
    StyledBodyInner,
    StyledForm,
    StyledError,
    StyledFooter,
    StyledActionButton,
    useLayerInstanceId,
} from './ModalStyles';
import {ReservationFormFields, type ReservationDetailFormState} from './ReservationDetailSections';
import {ReservationCreateCustomerFields} from './ReservationCreateCustomerFields';

interface ReservationCreateProps {
    initial: CreateReservationInitial;
    customerMap: CustomerMap;
    onClose: () => void;
    onSave: (reservation: Reservation) => void;
}

type CustomerMode = 'existing' | 'new';

export const ReservationCreate = ({initial, customerMap, onClose, onSave}: ReservationCreateProps) => {
    const reservationMap = useCalendarStore((s) => s.reservationMap);
    const designers = useCalendarStore((s) => s.designers);
    const addCustomer = useCalendarStore((s) => s.addCustomer);
    const modalRoot = document.getElementById('modal-root');
    const {layerId, layerDataId} = useLayerInstanceId('reservation-create');
    const {active: activeDesigners, onLeave: onLeaveDesigners, resigned: resignedDesigners} = splitDesignersByStatus(designers);
    const selectableDesigners = [...activeDesigners, ...onLeaveDesigners, ...resignedDesigners];

    const customers = Object.values(customerMap);

    const [customerId, setCustomerId] = useState<number>(0);
    const [customerQuery, setCustomerQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [customerMode, setCustomerMode] = useState<CustomerMode>('existing');
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerTel, setNewCustomerTel] = useState('');
    const [designerId, setDesignerId] = useState<number>(selectableDesigners[0]?.id ?? 0);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [isPriceManual, setIsPriceManual] = useState(false);
    const [form, setForm] = useState<ReservationDetailFormState>({
        date: initial.date,
        startTime: initial.startTime,
        endTime: calcEndTime(initial.startTime, 30),
        service: '',
        designerId: selectableDesigners[0]?.id ?? 0,
        price: 0,
        memo: '',
    });
    const [isEndTimeManual, setIsEndTimeManual] = useState(false);
    const [error, setError] = useState('');

    const filteredCustomers = customerQuery.trim()
        ? customers.filter((c) =>
            c.name.includes(customerQuery) || c.tel.includes(customerQuery)
        )
        : customers;

    useEffect(() => {
        if (designerId === 0 && selectableDesigners.length > 0) {
            setDesignerId(selectableDesigners[0].id);
            setForm((prev) => ({...prev, designerId: selectableDesigners[0].id}));
        }
    }, [designerId, selectableDesigners]);

    const handleCustomerSelect = (id: number) => {
        const c = customerMap[id];
        if (c) {
            setCustomerId(id);
            setCustomerQuery(c.name);
        }
        setShowSuggestions(false);
        setError('');
    };

    const handleCustomerInputChange = (value: string) => {
        setCustomerQuery(value);
        setCustomerId(0);
        setShowSuggestions(true);
        setError('');
    };

    const handleCustomerFocus = () => {
        clearTimeout(blurTimerRef.current);
        setShowSuggestions(true);
    };

    const handleCustomerBlur = () => {
        blurTimerRef.current = setTimeout(() => setShowSuggestions(false), 150);
    };

    const totalDuration = sumDurationMinutes(selectedServices);
    const totalPrice = sumPrice(selectedServices);

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

            const nextService = joinServiceNames(next);
            const duration = sumDurationMinutes(next);

            setForm((f) => {
                const updated = {...f, service: nextService};
                if (duration > 0) {
                    updated.endTime = calcEndTime(f.startTime, duration);
                }
                return updated;
            });

            if (!isPriceManual) {
                setForm((prev) => ({...prev, price: sumPrice(next)}));
            }

            setIsEndTimeManual(false);
            setError('');
            return next;
        });
    };

    const validate = (): string => {
        if (selectableDesigners.length > 0 && !designerId) return '디자이너를 선택해주세요.';
        if (customerMode === 'existing' && !customerId) return '고객을 선택해주세요.';
        if (customerMode === 'new' && !newCustomerName.trim()) return '신규 고객명을 입력해주세요.';
        if (customerMode === 'new' && !newCustomerTel.trim()) return '신규 고객 연락처를 입력해주세요.';
        if (selectedServices.length === 0) return '시술을 선택해주세요.';
        if (!form.date) return '날짜를 선택해주세요.';
        if (!form.startTime) return '시작 시간을 입력해주세요.';
        if (!form.endTime) return '종료 시간을 입력해주세요.';
        if (form.startTime >= form.endTime) return '시작 시간은 종료 시간보다 앞서야 합니다.';

        const overlap = findOverlap(reservationMap, form.date, form.startTime, form.endTime);

        if (overlap) {
            const name = customerMap[overlap.customerId]?.name ?? '-';
            return `${name} 예약(${overlap.startTime}~${overlap.endTime})과 시간이 겹칩니다.`;
        }

        return '';
    };

    const handleSave = () => {
        const msg = validate();
        if (msg) {
            setError(msg);
            return;
        }

        let nextCustomerId = customerId;

        if (customerMode === 'new') {
            const nextCustomer: Customer = {
                id: Date.now(),
                name: newCustomerName.trim(),
                tel: newCustomerTel.trim(),
            };

            addCustomer(nextCustomer);
            nextCustomerId = nextCustomer.id;
        }

        const reservation: Reservation = {
            id: Date.now(),
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            service: form.service,
            customerId: nextCustomerId,
            ...(designerId ? {designerId} : {}),
            status: 'active',
            price: form.price,
            ...(form.memo.trim() && {memo: form.memo.trim()}),
        };

        onSave(reservation);
    };

    if (!modalRoot) return null;

    return createPortal(<StyledCreateOverlay onClick={onClose}
                                             role="dialog"
                                             aria-modal="true"
                                             aria-label="예약 추가"
                                             id={layerId}
                                             data-layer-id={layerDataId}>
        <StyledDetail onClick={(e) => e.stopPropagation()}>
            <StyledHeader>
                <h3>예약 추가</h3>
                <button type="button" onClick={onClose} aria-label="닫기">닫기</button>
            </StyledHeader>

            <StyledBody><StyledBodyInner>
                <StyledCreateForm>
                    <ReservationCreateCustomerFields
                        customerMode={customerMode}
                        customerId={customerId}
                        customerQuery={customerQuery}
                        showSuggestions={showSuggestions}
                        filteredCustomers={filteredCustomers}
                        newCustomerName={newCustomerName}
                        newCustomerTel={newCustomerTel}
                        onChangeCustomerMode={(mode) => {
                            setCustomerMode(mode);
                            setError('');
                        }}
                        onChangeCustomerQuery={handleCustomerInputChange}
                        onFocusCustomerQuery={handleCustomerFocus}
                        onBlurCustomerQuery={handleCustomerBlur}
                        onSelectCustomer={handleCustomerSelect}
                        onChangeNewCustomerName={(value) => {
                            setNewCustomerName(value);
                            setError('');
                        }}
                        onChangeNewCustomerTel={(value) => {
                            setNewCustomerTel(value);
                            setError('');
                        }}
                    />
                    <ReservationFormFields
                        idPrefix="create"
                        form={{...form, designerId}}
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
                            setForm((prev) => ({...prev, price: num}));
                            setIsPriceManual(true);
                            setError('');
                        }}
                        onDesignerChange={(nextDesignerId) => {
                            setDesignerId(nextDesignerId);
                            setForm((prev) => ({...prev, designerId: nextDesignerId}));
                            setError('');
                        }}
                        onFieldChange={(field, value) => {
                            setForm((prev) => ({...prev, [field]: value}));
                            setError('');
                        }}
                        onStartTimeChange={handleStartTimeChange}
                        onEndTimeChange={handleEndTimeChange}
                    />
                </StyledCreateForm>
                {error && <StyledError>{error}</StyledError>}
            </StyledBodyInner></StyledBody>

            <StyledFooter>
                <StyledActionButton type="button" onClick={onClose}>취소</StyledActionButton>
                <StyledActionButton type="button" $primary onClick={handleSave}>저장</StyledActionButton>
            </StyledFooter>
        </StyledDetail>
    </StyledCreateOverlay>, modalRoot);
};

const StyledCreateOverlay = styled(StyledOverlay)`
  z-index: ${OVERLAY_Z_INDEX.base};
`;

const StyledCreateForm = styled(StyledForm)``;
