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

interface DesignerOffDayMoveConfirmModalProps {
    reservation: Reservation;
    nextReservation: Reservation;
    customerName?: string;
    warningMessage: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const DesignerOffDayMoveConfirmModal = ({
    reservation,
    nextReservation,
    customerName,
    warningMessage,
    onClose,
    onConfirm,
}: DesignerOffDayMoveConfirmModalProps) => {
    const modalRoot = document.getElementById('modal-root');
    const {layerId, layerDataId} = useLayerInstanceId('designer-off-day-move-confirm');
    const dialogRef = useDialogAccessibility<HTMLDivElement>(onClose);

    const dateChanged = reservation.date !== nextReservation.date;

    if (!modalRoot) return null;

    return createPortal(
        <StyledConfirmOverlay onClick={onClose}
                              role="dialog"
                              aria-modal="true"
                              aria-label="휴무일 이동 확인"
                              id={layerId}
                              data-layer-id={layerDataId}>
            <StyledConfirmModal ref={dialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
                <StyledHeader>
                    <StyledHeaderTitleGroup>
                        <h3>휴무일 이동 확인</h3>
                        <p>근무 외 일정으로 이동되기 전에 내용을 확인합니다.</p>
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
                        <dt>변경 후</dt>
                        <dd>
                            <StyledNewTime>{nextReservation.startTime} ~ {nextReservation.endTime}</StyledNewTime>
                        </dd>
                    </dl>
                    <StyledWarningMessage>{warningMessage} 이동하시겠습니까?</StyledWarningMessage>
                </StyledConfirmContent>
                <StyledFooter>
                    <StyledActionButton type="button" onClick={onClose}>아니오</StyledActionButton>
                    <StyledActionButton type="button" $primary onClick={onConfirm}>네</StyledActionButton>
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
    display: flex;
    flex-direction: column;
    gap: 12px;

    dl {
        display: grid;
        grid-template-columns: 52px 1fr;
        gap: 10px 12px;
        margin: 0;
    }

    dt {
        font-size: 13px;
        color: var(--dark-gray-color);
        font-weight: 500;
        padding-top: 1px;
    }

    dd {
        margin: 0;
        font-size: 13px;
        color: var(--black-color);
        font-weight: 500;
        line-height: 1.45;
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

const StyledWarningMessage = styled.p`
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-lg);
    background: rgba(168, 132, 23, 0.1);
    border: 1px solid rgba(168, 132, 23, 0.2);
    color: var(--caution-color);
    font-size: var(--small-font);
    font-weight: 600;
    line-height: 1.45;
    word-break: keep-all;
`;
