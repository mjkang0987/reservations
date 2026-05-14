import {createPortal} from 'react-dom';

import styled from 'styled-components';

import type {Reservation, ReservationMap} from '../../utils/reservations';
import type {ConflictInfo} from '../../hooks/useNaverBookingSync';
import {useCalendarStore} from '../../store/calendarStore';
import {buildServiceColorMap} from '../../utils/services';
import {getDesignerColor} from '../../utils/designers';

import {
    OVERLAY_Z_INDEX,
    StyledActionButton,
    StyledDetail,
    StyledFooter,
    StyledHeader,
    StyledHeaderTitleGroup,
    StyledModalContent,
    StyledOverlay,
    StyledStatusBadge,
    useDialogAccessibility,
    useLayerInstanceId,
} from '../calendar/overlays/ModalStyles';
import {CloseIconButton} from '../ui/CloseIconButton';
import {DesignerLabel, StyledDesignerLabel} from '../ui/DesignerLabel';
import {LabelBadge} from '../ui/LabelBadge';
import {ServiceChipList} from '../ui/ServiceChip';

interface NaverSyncConflictModalProps {
    conflict: ConflictInfo;
    onAdvance: () => void;
    onDefer: () => void;
    onSelectReservation: (reservation: Reservation) => void;
}

function findCurrentReservation(reservationMap: ReservationMap, original: Reservation): Reservation | undefined {
    for (const reservations of Object.values(reservationMap)) {
        const matched = reservations.find((r) => r.id === original.id);
        if (matched) {
            return matched;
        }
    }

    return undefined;
}

export const NaverSyncConflictModal = ({
    conflict,
    onAdvance,
    onDefer,
    onSelectReservation,
}: NaverSyncConflictModalProps) => {
    const {layerId, layerDataId} = useLayerInstanceId('naver-sync-conflict');
    const dialogRef = useDialogAccessibility<HTMLDivElement>(onAdvance);
    const customerMap = useCalendarStore((s) => s.customerMap);
    const designers = useCalendarStore((s) => s.designers);
    const reservationMap = useCalendarStore((s) => s.reservationMap);
    const serviceCatalog = useCalendarStore((s) => s.serviceCatalog);
    const categoryBaseColorMap = useCalendarStore((s) => s.categoryBaseColorMap);
    const serviceColorMap = buildServiceColorMap(serviceCatalog, categoryBaseColorMap);

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    const getCustomerName = (r: Reservation) => customerMap[r.customerId]?.name ?? '고객';
    const getDesignerName = (r: Reservation) => designers.find((d) => d.id === r.designerId)?.name ?? '미지정';
    const getDesignerDotColor = (r: Reservation) => getDesignerColor(designers.find((d) => d.id === r.designerId));
    const formatTime = (r: Reservation) => `${r.startTime} ~ ${r.endTime}`;

    const renderReservation = (reservation: Reservation, isDangerTime: boolean, isDangerDesigner: boolean) => {
        return (
            <StyledReservationDl>
                <dt>고객명</dt>
                <dd>
                    <StyledCustomerValue>{getCustomerName(reservation)}</StyledCustomerValue>
                </dd>

                <dt>날짜</dt>
                <dd>{reservation.date}</dd>

                <StyledFieldLabel>
                    <span>시간</span>
                </StyledFieldLabel>
                <dd>
                    {isDangerTime ? (
                        <StyledDangerTimeRow>
                            <StyledDangerTime>{formatTime(reservation)}</StyledDangerTime>
                            <StyledStatusBadge $variant="danger">중복</StyledStatusBadge>
                        </StyledDangerTimeRow>
                    ) : (
                        formatTime(reservation)
                    )}
                </dd>

                <dt>시술</dt>
                <dd>
                    <StyledServiceChipList service={reservation.service}
                                          serviceColorMap={serviceColorMap}
                                          keyPrefix={reservation.id} />
                </dd>

                <StyledFieldLabel>
                    <span>디자이너</span>
                </StyledFieldLabel>
                <dd>
                    {isDangerDesigner ? (
                        <StyledDangerTimeRow>
                            <StyledDesignerText>
                                <DesignerLabel color={getDesignerDotColor(reservation)} name={getDesignerName(reservation)} />
                            </StyledDesignerText>
                            <StyledStatusBadge $variant="danger">중복</StyledStatusBadge>
                        </StyledDangerTimeRow>
                    ) : (
                        <DesignerLabel color={getDesignerDotColor(reservation)} name={getDesignerName(reservation)} />
                    )}
                </dd>
            </StyledReservationDl>
        );
    };

    const currentNew = findCurrentReservation(reservationMap, conflict.newReservation) ?? conflict.newReservation;
    const currentExisting = findCurrentReservation(reservationMap, conflict.existingReservation) ?? conflict.existingReservation;

    const stillOverlapping =
        currentNew.startTime < currentExisting.endTime
        && currentNew.endTime > currentExisting.startTime
        && currentNew.date === currentExisting.date;
    const sameDesigner =
        stillOverlapping
        && currentNew.designerId != null
        && currentNew.designerId === currentExisting.designerId;
    return createPortal(
        <StyledConfirmOverlay onClick={onAdvance}
                              role="dialog"
                              aria-modal="true"
                              aria-label="예약 시간 중복 안내"
                              id={layerId}
                              data-layer-id={layerDataId}>
            <StyledConfirmModal ref={dialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
                <StyledHeader>
                    <StyledHeaderTitleGroup>
                        <h3>예약 시간 중복 안내</h3>
                        <p>네이버 예약 동기화 중 시간이 겹치는 예약이 발견되었습니다.</p>
                    </StyledHeaderTitleGroup>
                    <CloseIconButton onClick={onAdvance} />
                </StyledHeader>
                <StyledScrollArea>
                    <StyledModalContent>
                        <StyledGuideNotice>
                            네이버예약의 실제 변경/취소는 스마트플레이스 통해서 가능합니다.
                        </StyledGuideNotice>
                        <StyledConflictCard>
                            <StyledConflictLabel>네이버 예약</StyledConflictLabel>
                            <StyledClickableInfo onClick={() => onSelectReservation(currentNew)}>
                                {renderReservation(currentNew, stillOverlapping, sameDesigner)}
                            </StyledClickableInfo>

                            <StyledConflictLabel $existing>전화 예약</StyledConflictLabel>
                            <StyledClickableInfo onClick={() => onSelectReservation(currentExisting)}>
                                {renderReservation(currentExisting, stillOverlapping, sameDesigner)}
                            </StyledClickableInfo>
                        </StyledConflictCard>
                    </StyledModalContent>
                </StyledScrollArea>
                <StyledFooter>
                    <StyledActionButton type="button" onClick={onDefer}>보류</StyledActionButton>
                    <StyledActionButton type="button" $primary onClick={onAdvance}>확인</StyledActionButton>
                </StyledFooter>
            </StyledConfirmModal>
        </StyledConfirmOverlay>,
        modalRoot
    );
};

const StyledConfirmOverlay = styled(StyledOverlay)`
    z-index: ${OVERLAY_Z_INDEX.supporting};
`;

const StyledCustomerValue = styled.span`
    font-weight: 600;
    color: #0f172a;
`;

const StyledServiceChipList = styled(ServiceChipList)``;

const StyledDesignerText = styled.span`
    display: inline-flex;
    align-items: center;
`;

const StyledConfirmModal = styled(StyledDetail)`
    width: min(420px, 90vw);
    max-width: min(420px, 90vw);
`;

const StyledScrollArea = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    max-height: 60vh;
`;

const StyledGuideNotice = styled.p`
    margin: 0 0 12px;
    padding: 9px 10px;
    border-radius: 8px;
    background: rgba(3, 199, 90, 0.08);
    color: #0f5132;
    font-size: 12px;
    line-height: 1.45;
    word-break: keep-all;
`;

const StyledConflictCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: var(--radius-md);
    background: rgba(248, 250, 252, 0.5);

    & + & {
        margin-top: 12px;
    }
`;

const StyledConflictLabel = styled(LabelBadge).attrs<{ $existing?: boolean }>((props) => ({
    $tone: props.$existing ? 'warning' : 'brand',
    $shape: 'soft',
    $size: 'sm',
}))<{ $existing?: boolean }>`
    width: fit-content;
`;

const StyledClickableInfo = styled.div`
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: background-color 0.14s ease;

    @media (hover: hover) and (pointer: fine) {
        &:hover {
            background-color: rgba(59, 130, 246, 0.06);
        }
    }
`;

const StyledReservationDl = styled.dl`
    display: grid;
    grid-template-columns: 60px 1fr;
    gap: 4px 8px;
    padding: 4px 8px;
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: var(--radius-md);
    margin: 0;

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

const StyledFieldLabel = styled.dt`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--dark-gray-color);
    font-weight: 500;
`;

const StyledInlineConflictBadge = styled(LabelBadge).attrs({
    $tone: 'danger',
    $shape: 'soft',
    $size: 'sm',
})`
    font-size: 10px;
`;

const StyledDangerTime = styled.span`
    color: var(--danger-color);
    font-weight: 600;
`;

const StyledDangerTimeRow = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
`;
