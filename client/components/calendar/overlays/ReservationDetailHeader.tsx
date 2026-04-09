import React from 'react';

import styled from 'styled-components';

import {getServiceColor, parseServiceString} from '../../../utils/services';
import {StyledHeader} from './ModalStyles';

type ReservationDetailHeaderProps = {
    title: string;
    service: string;
    serviceColorMap: Record<string, string>;
    onClose: () => void;
};

export function ReservationDetailHeader({
    title,
    service,
    serviceColorMap,
    onClose,
}: ReservationDetailHeaderProps) {
    return (
        <StyledReservationHeader>
            <StyledReservationTitleGroup>
                <StyledServiceBadgeList>
                    {parseServiceString(service).map((serviceName) => (
                        <StyledServiceDotBadge
                            key={serviceName}
                            $color={getServiceColor(serviceName, serviceColorMap)}
                            aria-label={serviceName}
                            title={serviceName}
                        />
                    ))}
                </StyledServiceBadgeList>
                <h3>{title}</h3>
            </StyledReservationTitleGroup>
            <button type="button" onClick={onClose} aria-label="닫기">닫기</button>
        </StyledReservationHeader>
    );
}

const StyledReservationHeader = styled(StyledHeader)``;

const StyledReservationTitleGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    h3 {
        margin: 0;
    }
`;

const StyledServiceBadgeList = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
`;

const StyledServiceDotBadge = styled.span<{ $color: string }>`
    display: inline-flex;
    align-items: center;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background-color: ${(props) => props.$color};
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
`;
