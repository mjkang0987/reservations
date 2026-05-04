import React from 'react';

import styled from 'styled-components';

import {getServiceColor, parseServiceString} from '../../../utils/services';
import {CloseIconButton} from '../../ui/CloseIconButton';
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
                        <StyledServiceBadge
                            key={serviceName}
                            $color={getServiceColor(serviceName, serviceColorMap)}
                        >
                            {serviceName}
                        </StyledServiceBadge>
                    ))}
                </StyledServiceBadgeList>
                <h3>{title}</h3>
            </StyledReservationTitleGroup>
            <CloseIconButton onClick={onClose} />
        </StyledReservationHeader>
    );
}

const StyledReservationHeader = styled(StyledHeader)``;

const StyledReservationTitleGroup = styled.div`
    display: flex;
    gap: 4px;
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

const StyledServiceBadge = styled.span<{ $color: string }>`
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: var(--xsmall-font);
    font-weight: 600;
    color: ${(props) => props.$color};
    background-color: ${(props) => `${props.$color}18`};
`;
