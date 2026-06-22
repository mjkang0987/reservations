import {createPortal} from 'react-dom';
import styled from 'styled-components';

import type {SyncNotification} from '../../hooks/useNaverBookingSync';
import {CloseIconButton} from '../ui/CloseIconButton';

interface Props {
    notification: SyncNotification;
    onClose: () => void;
}

function formatDate(dateStr: string): string {
    if (!dateStr || !dateStr.includes('-')) return dateStr || '-';
    const [, m, d] = dateStr.split('-');
    return `${Number(m)}/${Number(d)}`;
}

function formatResolvedAt(iso?: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

export const ConflictResolutionDetailModal = ({notification, onClose}: Props) => {
    if (typeof document === 'undefined') return null;

    const isAuto = notification.resolvedBy === 'auto';

    return createPortal(
        <StyledOverlay onClick={onClose}>
            <StyledModal onClick={(e) => e.stopPropagation()}>
                <StyledHeader>
                    <StyledTitle>중복예약 해결 내역</StyledTitle>
                    <CloseIconButton onClick={onClose} />
                </StyledHeader>

                <StyledSection>
                    <StyledSectionLabel>충돌 정보</StyledSectionLabel>
                    <StyledRow>
                        <StyledTerm>일시</StyledTerm>
                        <StyledDesc>{formatDate(notification.appointmentDate)} {notification.appointmentTime}</StyledDesc>
                    </StyledRow>
                    <StyledRow>
                        <StyledTerm>고객</StyledTerm>
                        <StyledDesc>{notification.customerName || '고객'}</StyledDesc>
                    </StyledRow>
                    <StyledRow>
                        <StyledTerm>디자이너</StyledTerm>
                        <StyledDesc>{notification.designerName || '미지정'}</StyledDesc>
                    </StyledRow>
                </StyledSection>

                <StyledSection>
                    <StyledSectionLabel>해결 내역</StyledSectionLabel>
                    <StyledRow>
                        <StyledTerm>처리 방법</StyledTerm>
                        <StyledDesc>
                            <StyledBadge $auto={isAuto}>{isAuto ? '자동 해소' : '처리완료'}</StyledBadge>
                        </StyledDesc>
                    </StyledRow>
                    <StyledRow>
                        <StyledTerm>처리 시각</StyledTerm>
                        <StyledDesc>{formatResolvedAt(notification.resolvedAt)}</StyledDesc>
                    </StyledRow>
                    {isAuto ? (
                        <StyledNote>충돌하던 예약이 취소·삭제되어 자동으로 해소되었습니다.</StyledNote>
                    ) : (
                        <>
                            <StyledRow>
                                <StyledTerm>사유</StyledTerm>
                                <StyledDesc>{notification.resolutionReason || '-'}</StyledDesc>
                            </StyledRow>
                            {notification.resolutionMemo && (
                                <StyledRow>
                                    <StyledTerm>메모</StyledTerm>
                                    <StyledDesc>{notification.resolutionMemo}</StyledDesc>
                                </StyledRow>
                            )}
                        </>
                    )}
                </StyledSection>
            </StyledModal>
        </StyledOverlay>,
        document.body,
    );
};

const StyledOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1200;
`;

const StyledModal = styled.div`
    width: min(420px, calc(100vw - 32px));
    background: var(--white-color);
    border-radius: 12px;
    padding: 20px;
    box-sizing: border-box;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
`;

const StyledHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
`;

const StyledTitle = styled.h3`
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--dark-gray-color);
`;

const StyledSection = styled.div`
    padding: 12px 0;
    border-top: 1px solid var(--border-color);
`;

const StyledSectionLabel = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: var(--gray-color);
    margin-bottom: 8px;
`;

const StyledRow = styled.div`
    display: flex;
    gap: 12px;
    padding: 4px 0;
    font-size: 14px;
`;

const StyledTerm = styled.span`
    flex: 0 0 64px;
    color: var(--gray-color);
`;

const StyledDesc = styled.span`
    flex: 1;
    color: var(--dark-gray-color);
    word-break: break-word;
`;

const StyledNote = styled.p`
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--gray-color);
    line-height: 1.5;
`;

const StyledBadge = styled.span<{ $auto?: boolean }>`
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--white-color);
    background: ${(props) => props.$auto ? 'var(--gray-color)' : 'var(--brand-color)'};
`;
