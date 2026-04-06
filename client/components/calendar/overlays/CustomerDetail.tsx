import {useMemo, useState} from 'react';

import {createPortal} from 'react-dom';

import styled from 'styled-components';

import type {Customer} from '../../../utils/customers';
import type {Reservation, ReservationMap} from '../../../utils/reservations';

import {
    OVERLAY_Z_INDEX,
    StyledOverlay,
    StyledDetail,
    StyledHeader,
} from './ModalStyles';

import {buildServiceColorMap, getServiceColor} from '../../../utils/services';
import {useCalendarStore} from '../../../store/calendarStore';

const PAGE_SIZE = 5;

interface CustomerDetailProps {
    customer: Customer;
    reservationMap: ReservationMap;
    onClose: () => void;
    onReservationClick?: (reservation: Reservation) => void;
}

export const CustomerDetail = ({customer, reservationMap, onClose, onReservationClick}: CustomerDetailProps) => {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const serviceCatalog = useCalendarStore((s) => s.serviceCatalog);
    const categoryBaseColorMap = useCalendarStore((s) => s.categoryBaseColorMap);
    const modalRoot = document.getElementById('modal-root');
    const serviceColorMap = useMemo(
        () => buildServiceColorMap(serviceCatalog, categoryBaseColorMap),
        [serviceCatalog, categoryBaseColorMap]
    );

    const customerReservations = useMemo(() => {
        const list: Reservation[] = [];

        for (const items of Object.values(reservationMap)) {
            for (const r of items) {
                if (r.customerId === customer.id) {
                    list.push(r);
                }
            }
        }

        list.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
        return list;
    }, [reservationMap, customer.id]);

    const visibleList = customerReservations.slice(0, visibleCount);
    const hasMore = visibleCount < customerReservations.length;

    if (!modalRoot) return null;

    return createPortal(<StyledCustomerOverlay onClick={onClose}
                                               role="dialog"
                                               aria-modal="true"
                                               aria-label="고객 정보">
        <StyledCustomerDetail onClick={(e) => e.stopPropagation()}>
            <StyledHeader>
                <h3>{customer.name}</h3>
                <button type="button" onClick={onClose} aria-label="닫기">&#x2715;</button>
            </StyledHeader>
            <StyledInfo>
                <dl>
                    <dt>연락처</dt>
                    <dd>{customer.tel}</dd>
                </dl>
            </StyledInfo>
            <StyledReservationSection>
                <h4>예약 내역 ({customerReservations.length})</h4>
                <StyledReservationList>
                    {visibleList.map((r) => (
                        <StyledReservationItem key={r.id}
                                               type="button"
                                               $clickable={!!onReservationClick}
                                               $color={getServiceColor(r.service, serviceColorMap)}
                                               onClick={() => onReservationClick?.(r)}>
                            <span className="date">{r.date}</span>
                            <span className="time">{r.startTime} ~ {r.endTime}</span>
                            <strong>{r.service}</strong>
                        </StyledReservationItem>
                    ))}
                </StyledReservationList>
                {hasMore && <StyledMoreButton type="button"
                                              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
                    더보기
                </StyledMoreButton>}
            </StyledReservationSection>
        </StyledCustomerDetail>
    </StyledCustomerOverlay>, modalRoot);
};

const StyledCustomerOverlay = styled(StyledOverlay)`
  z-index: ${OVERLAY_Z_INDEX.childDetail};
`;

const StyledCustomerDetail = styled(StyledDetail)`
  width: 360px;
`;

const StyledInfo = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--light-gray-color);

  dl {
    display: grid;
    grid-template-columns: 60px 1fr;
    gap: 4px 12px;
    margin: 0;
  }

  dt {
    font-size: 13px;
    color: var(--gray-color);
    font-weight: 500;
  }

  dd {
    margin: 0;
    font-size: 13px;
  }
`;

const StyledReservationSection = styled.div`
  padding: 12px 16px;
  overflow-y: auto;
  overscroll-behavior: auto;
  flex: 1;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 600;
  }
`;

const StyledReservationList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StyledReservationItem = styled.button<{ $color: string; $clickable: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 4px;
  background-color: ${props => props.$color};
  color: #fff;
  font-size: 12px;
  text-align: left;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};

  .date {
    opacity: 0.9;
  }

  .time {
    opacity: 0.9;
  }

  strong {
    font-weight: 600;
    margin-left: auto;
  }

  &:hover {
    filter: ${props => props.$clickable ? 'brightness(0.96)' : 'none'};
  }
`;

const StyledMoreButton = styled.button`
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  border: 1px solid var(--light-gray-color);
  border-radius: 4px;
  background: none;
  font-size: 13px;
  color: var(--gray-color);
  cursor: pointer;

  &:hover {
    background-color: var(--black-color-10);
  }
`;
