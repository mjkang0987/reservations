import React from 'react';

import styled from 'styled-components';

import type {Reservation} from '../../../utils/reservations';
import {getServiceColor, parseServiceString} from '../../../utils/services';
import {pad} from '../../../utils/timeRound';

type TimelineClusterReservation = Reservation;

type TimelineClusterData = {
    id: string;
    startMinutes: number;
    endMinutes: number;
    reservations: TimelineClusterReservation[];
};

type TimelineClusterProps = {
    cluster: TimelineClusterData;
    blockTop: number;
    blockHeight: number;
    isOpen: boolean;
    designerColorMap: Record<number, string>;
    serviceColorMap: Record<string, string>;
    customerMap: Record<number, { name: string } | undefined>;
    designerNameById: (designerId?: number) => string;
    onToggle: () => void;
    onReservationClick: (reservation: Reservation) => void;
};

export function TimelineCluster({
    cluster,
    blockTop,
    blockHeight,
    isOpen,
    designerColorMap,
    serviceColorMap,
    customerMap,
    designerNameById,
    onToggle,
    onReservationClick,
}: TimelineClusterProps) {
    const designerDots = Array.from(new Map(cluster.reservations.map((reservation) => [
        reservation.designerId ?? 0,
        reservation.designerId ? (designerColorMap[reservation.designerId] ?? '#8E8E93') : '#8E8E93'
    ])).values());

    return (
        <StyledOverlapWrap style={{top: blockTop, height: blockHeight}}>
            <StyledOverlapButton
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
            >
                <StyledOverlapDotList>
                    {designerDots.map((color, index) => (
                        <StyledOverlapDot key={`${cluster.id}-${index}`} $color={color} />
                    ))}
                </StyledOverlapDotList>
                <strong>{cluster.reservations.length}건 예약</strong>
                <span>{`${pad(Math.floor(cluster.startMinutes / 60))}:${pad(cluster.startMinutes % 60)} ~ ${pad(Math.floor(cluster.endMinutes / 60))}:${pad(cluster.endMinutes % 60)}`}</span>
            </StyledOverlapButton>
            {isOpen && (
                <StyledOverlapDropdown onClick={(e) => e.stopPropagation()}>
                    {cluster.reservations
                        .slice()
                        .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime))
                        .map((reservation) => {
                            const customer = customerMap[reservation.customerId];
                            const designerColor = reservation.designerId
                                ? (designerColorMap[reservation.designerId] ?? '#8E8E93')
                                : '#8E8E93';

                            return (
                                <StyledOverlapItem
                                    key={reservation.id}
                                    type="button"
                                    onClick={() => onReservationClick(reservation)}
                                >
                                    <StyledOverlapItemTop>
                                        <StyledOverlapItemDesigner>
                                            <StyledOverlapDot $color={designerColor} />
                                            <span>{designerNameById(reservation.designerId)}</span>
                                        </StyledOverlapItemDesigner>
                                        <span>{reservation.startTime}~{reservation.endTime}</span>
                                    </StyledOverlapItemTop>
                                    <StyledOverlapItemService>
                                        {parseServiceString(reservation.service).map((serviceName) => (
                                            <span className="service-token" key={`${reservation.id}-${serviceName}`}>
                                                <span className="dot" style={{backgroundColor: getServiceColor(serviceName, serviceColorMap)}} />
                                                {serviceName}
                                            </span>
                                        ))}
                                    </StyledOverlapItemService>
                                    {customer && <span className="detail">{customer.name}</span>}
                                </StyledOverlapItem>
                            );
                        })}
                </StyledOverlapDropdown>
            )}
        </StyledOverlapWrap>
    );
}

const StyledOverlapWrap = styled.div`
    position: absolute;
    left: 5px;
    right: 5px;
    z-index: 12;
`;

const StyledOverlapButton = styled.button`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
    min-height: 100%;
    padding: 6px 8px;
    border: 1px solid var(--blue-color);
    border-left-width: 4px;
    border-radius: var(--radius-sm);
    background: rgba(45, 127, 249, 0.12);
    color: var(--dark-gray-color);
    text-align: left;
    box-sizing: border-box;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
    cursor: pointer;

    strong {
        font-size: var(--small-font);
        font-weight: 700;
    }

    span {
        font-size: var(--tiny-font);
        opacity: 0.9;
    }
`;

const StyledOverlapDotList = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const StyledOverlapDot = styled.span<{ $color: string }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${(props) => props.$color};
    flex-shrink: 0;
`;

const StyledOverlapDropdown = styled.div`
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: min(240px, calc(100vw - 32px));
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border: 1px solid var(--light-gray-color);
    border-radius: 10px;
    background: var(--white-color);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
    z-index: 20;
`;

const StyledOverlapItem = styled.button`
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding: 8px;
    border: 1px solid var(--light-gray-color);
    border-radius: 8px;
    background: var(--white-color);
    text-align: left;
    color: var(--dark-gray-color);
    cursor: pointer;

    &:hover {
        background: var(--black-color-10);
    }

    .detail {
        font-size: var(--tiny-font);
        color: var(--dark-gray-color2);
    }

    .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-right: 4px;
        border-radius: 50%;
        vertical-align: middle;
    }

    .service-token {
        display: inline-flex;
        align-items: center;
        margin-right: 6px;
    }
`;

const StyledOverlapItemTop = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: var(--tiny-font);
`;

const StyledOverlapItemDesigner = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
`;

const StyledOverlapItemService = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    font-size: var(--small-font);
    font-weight: 600;
`;
