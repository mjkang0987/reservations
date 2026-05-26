import {createPortal} from 'react-dom';

import styled from 'styled-components';

import type {Reservation} from '../../../utils/reservations';

import {
    OVERLAY_Z_INDEX,
    StyledActionButton,
    StyledDetail,
    StyledFooter,
    StyledHeader,
    StyledHeaderTitleGroup,
    StyledOverlay,
    useDialogAccessibility,
    useLayerInstanceId,
} from './ModalStyles';
import {CloseIconButton} from '../../ui/CloseIconButton';

interface ReservationMoveConfirmModalProps {
    reservation: Reservation;
    nextReservation: Reservation;
    customerName?: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const ReservationMoveConfirmModal = ({
    reservation,
    nextReservation,
    customerName,
    onClose,
    onConfirm,
}: ReservationMoveConfirmModalProps) => {
    const modalRoot = document.getElementById('modal-root');
    const {layerId, layerDataId} = useLayerInstanceId('reservation-move-confirm');
    const dialogRef = useDialogAccessibility<HTMLDivElement>(onClose);

    const dateChanged = reservation.date !== nextReservation.date;

    if (!modalRoot) return null;

    return createPortal(
        <StyledConfirmOverlay onClick={onClose}
                              role="dialog"
                              aria-modal="true"
                              aria-label="예약 변경 확인"
                              id={layerId}
                              data-layer-id={layerDataId}>
            <StyledConfirmModal ref={dialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
                <StyledHeader>
                    <StyledHeaderTitleGroup>
                        <h3>예약 변경 전 확인</h3>
                        <p>이동할 예약 시간을 한 번 더 확인합니다.</p>
                    </StyledHeaderTitleGroup>
                    <CloseIconButton onClick={onClose} />
                </StyledHeader>
                <StyledConfirmContent>
                    <dl>
                        <dt>시술</dt>
                        <dd>{reservation.service}</dd>
                        {customerName && (
                            <>
                                <dt>고객</dt>
                                <dd>{customerName}</dd>
                            </>
                        )}
                        {dateChanged && (
                            <>
                                <dt>날짜</dt>
                                <dd>
                                    <StyledChangeRow>
                                        <span>{reservation.date}</span>
                                        <StyledArrow>→</StyledArrow>
                                        <span>{nextReservation.date}</span>
                                    </StyledChangeRow>
                                </dd>
                            </>
                        )}
                        {!dateChanged && (
                            <>
                                <dt>날짜</dt>
                                <dd>{reservation.date}</dd>
                            </>
                        )}
                        <dt>변경 전</dt>
                        <dd>
                            <StyledOldTime>{reservation.startTime} ~ {reservation.endTime}</StyledOldTime>
                        </dd>
                        <dt>변경 후</dt>
                        <dd>
                            <StyledNewTime>{nextReservation.startTime} ~ {nextReservation.endTime}</StyledNewTime>
                        </dd>
                    </dl>
                </StyledConfirmContent>
                <StyledFooter>
                    <StyledActionButton type="button" onClick={onClose}>취소</StyledActionButton>
                    <StyledActionButton type="button" $primary onClick={onConfirm}>변경</StyledActionButton>
                </StyledFooter>
            </StyledConfirmModal>
        </StyledConfirmOverlay>,
        modalRoot
    );
};

const StyledConfirmOverlay = styled(StyledOverlay)`
    z-index: ${OVERLAY_Z_INDEX.confirm};
`;

const StyledConfirmModal = styled(StyledDetail)`
    width: min(360px, 90vw);
`;

const StyledConfirmContent = styled.div`
    padding: var(--modal-body-padding);

    dl {
        display: grid;
        grid-template-columns: 60px 1fr;
        gap: 8px 12px;
        margin: 0;
    }

    dt {
        font-size: 13px;
        color: var(--dark-gray-color);
        font-weight: 500;
    }

    dd {
        margin: 0;
        font-size: 13px;
    }
`;

const StyledChangeRow = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
`;

const StyledArrow = styled.span`
    font-size: 12px;
    color: var(--dark-gray-color2);
`;

const StyledOldTime = styled.span`
    display: inline-block;
    padding: 2px 8px;
    border-radius: var(--radius-md);
    background: var(--gray-color2);
    font-size: 13px;
    color: var(--dark-gray-color2);
    text-decoration: line-through;
`;

const StyledNewTime = styled.span`
    display: inline-block;
    padding: 2px 8px;
    border-radius: var(--radius-md);
    background: rgba(0, 169, 230, 0.08);
    border: 1px solid rgba(0, 169, 230, 0.2);
    font-size: 13px;
    font-weight: 700;
    color: var(--blue-color);
`;
