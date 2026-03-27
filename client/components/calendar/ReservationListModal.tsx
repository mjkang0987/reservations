import {useMemo} from 'react';

import {createPortal} from 'react-dom';

import styled from 'styled-components';

import {useCalendarStore} from '../../store/calendarStore';

import {getServiceColor} from '../../utils/services';

import type {Reservation} from '../../utils/reservations';

const STATUS_LABELS: Record<string, string> = {
    cancelled: '취소',
    noshow: '노쇼',
};

const STATUS_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
    booked: {bg: '#E8F0FE', color: '#4285F4'},
    cancelled: {bg: '#F1F1F1', color: '#999'},
    completed: {bg: '#E6F4EA', color: '#34A853'},
    noshow: {bg: '#FCE8E6', color: '#EA4335'},
};

export const ReservationListModal = () => {
    const reservationMap = useCalendarStore((s) => s.reservationMap);
    const customerMap = useCalendarStore((s) => s.customerMap);
    const filter = useCalendarStore((s) => s.reservationListFilter);
    const setReservationListFilter = useCalendarStore((s) => s.setReservationListFilter);
    const setSelectedReservation = useCalendarStore((s) => s.setSelectedReservation);
    const modalRoot = document.getElementById('modal-root');

    const today = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const {title, reservations} = useMemo(() => {
        if (!filter) return {title: '', reservations: [] as Reservation[]};

        if (filter.type === 'date') {
            const list = (reservationMap[filter.dateKey] || [])
                .slice()
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
            return {title: filter.dateKey, reservations: list};
        }

        const pad = (n: number) => String(n + 1).padStart(2, '0');
        const prefix = `${filter.year}-${pad(filter.month)}`;
        const list: Reservation[] = [];

        for (const [key, rList] of Object.entries(reservationMap)) {
            if (key.startsWith(prefix)) {
                list.push(...rList);
            }
        }

        list.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
        return {title: `${filter.year}년 ${filter.month + 1}월`, reservations: list};
    }, [filter, reservationMap]);

    const getStatusType = (r: Reservation) => {
        if (r.status === 'cancelled') return 'cancelled';
        if (r.status === 'noshow') return 'noshow';
        if (r.date < today) return 'completed';
        return 'booked';
    };

    const getStatusLabel = (r: Reservation) => {
        const type = getStatusType(r);
        if (type === 'booked') return '예약';
        if (type === 'completed') return '완료';
        return STATUS_LABELS[type] || '예약';
    };

    const handleClose = () => setReservationListFilter(null);

    const handleClick = (r: Reservation) => {
        setSelectedReservation(r);
    };

    if (!modalRoot) return null;

    return createPortal(<StyledOverlay onClick={handleClose}
                                       role="dialog"
                                       aria-modal="true"
                                       aria-label="예약 목록">
        <StyledModal onClick={(e) => e.stopPropagation()}>
            <StyledHeader>
                <h3>{title} 예약 ({reservations.length})</h3>
                <button type="button"
                        onClick={handleClose}
                        aria-label="닫기">&#x2715;</button>
            </StyledHeader>
            <StyledBody>
                {reservations.length === 0 ? (
                    <StyledEmpty>예약이 없습니다.</StyledEmpty>
                ) : (
                    <StyledList>
                        {reservations.map((r, i) => {
                            const customer = customerMap[r.customerId];
                            const statusType = getStatusType(r);
                            const isInactive = statusType === 'cancelled' || statusType === 'noshow';

                            return (
                                <StyledItem key={r.id}
                                            $color={getServiceColor(r.service)}
                                            $inactive={isInactive}
                                            onClick={() => handleClick(r)}>
                                    {filter?.type === 'month' && <StyledDateCol>{r.date.slice(5)}</StyledDateCol>}
                                    <StyledTime>{r.startTime}~{r.endTime}</StyledTime>
                                    <StyledService>{r.service}</StyledService>
                                    <StyledCustomer>{customer?.name ?? '-'}</StyledCustomer>
                                    <StyledBadge $type={statusType}>{getStatusLabel(r)}</StyledBadge>
                                </StyledItem>
                            );
                        })}
                    </StyledList>
                )}
            </StyledBody>
        </StyledModal>
    </StyledOverlay>, modalRoot);
};

const StyledOverlay = styled.div`
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.4);
    box-sizing: border-box;
`;

const StyledModal = styled.div`
    width: 100%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    overflow: hidden;
`;

const StyledHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    padding: 12px 16px;
    border-bottom: 1px solid var(--light-gray-color);

    h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    > button {
        border: none;
        background: none;
        font-size: 16px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        color: var(--gray-color);
    }
`;

const StyledBody = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 12px;
`;

const StyledEmpty = styled.p`
    padding: 24px;
    text-align: center;
    font-size: var(--small-font);
    color: var(--gray-color);
`;

const StyledList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const StyledItem = styled.li<{ $color: string; $inactive: boolean }>`
    display: grid;
    grid-template-columns: 100px 1fr 60px 44px;
    gap: 8px;
    align-items: center;
    padding: 8px 10px;
    border-radius: 4px;
    border-left: 3px solid ${(props) => props.$color};
    background-color: var(--black-color-10);
    font-size: var(--small-font);
    cursor: pointer;
    opacity: ${(props) => props.$inactive ? 0.5 : 1};

    &:hover {
        background-color: var(--light-gray-color);
    }
`;

const StyledDateCol = styled.span`
    font-weight: 500;
`;

const StyledTime = styled.span`
    color: var(--dark-gray-color);
`;

const StyledService = styled.span`
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const StyledCustomer = styled.span`
    color: var(--dark-gray-color);
    text-align: center;
`;

const StyledBadge = styled.span<{ $type: string }>`
    display: inline-block;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: var(--tiny-font);
    font-weight: 600;
    text-align: center;
    white-space: nowrap;
    background-color: ${(props) => STATUS_BADGE_STYLES[props.$type]?.bg || '#F1F1F1'};
    color: ${(props) => STATUS_BADGE_STYLES[props.$type]?.color || '#999'};
`;
