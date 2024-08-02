import React, {
    ReactNode,
    Ref,
    useEffect,
    useRef,
    useState
} from 'react';

import styled from 'styled-components';

import {useRecoilValue} from 'recoil';

import {
    ReservationsType,
    viewState
} from '../../recoil/atoms';

import {
    HEIGHTS,
    ViewType
} from '../../utils/constants';

import {
    TimeStartType
} from '../../utils/utils';

import {Reservation} from './Reservation';
import {RestReservationsComponent} from './ReservationsRest';

export const ReservationsComponents = ({
    items
}: { items: ReservationsType[] }) => {
    const view = useRecoilValue(viewState);
    const [height, setHeight] = useState(0);
    const [overIndex, setOverIndex] = useState(-1);
    const reservationsRef = useRef<HTMLDivElement | null>(null);

    const setTimePosition = ({
        startHours,
        startMinutes
    }: TimeStartType) => {
        return ((startHours - 10) * 120) + (startMinutes * 2);
    };

    useEffect(() => {
        if (!reservationsRef.current) {
            return;
        }

        const currHeight = reservationsRef.current.clientHeight;

        if (height !== currHeight) {
            setHeight(currHeight);
        }

        const findIndex = items.findIndex((_, i) => (i + 2) * HEIGHTS.RESERVATION > height);
        setOverIndex(findIndex);
    }, [height, setHeight]);

    const filterItems = view.type === ViewType.Month
                        ? items.slice(0, overIndex === -1 ? items.length : overIndex)
                        : items;

    return (<StyledReserveWrap ref={reservationsRef}
                               type={view.type}>
        {height !== 0 && filterItems.map((item, i) =>
            <Reservation key={`${item.id}_${item.startHours}_${item.startMinutes}`}
                         transform={`translate(0, ${view.type === ViewType.Month
                                                    ? HEIGHTS.RESERVATION * i
                                                    : setTimePosition({
                                 startHours  : item.startHours,
                                 startMinutes: item.startMinutes
                             })}px)`}
                         item={item}/>)}
        {items.length - filterItems.length > 0 &&
            <RestReservationsComponent items={items}
                                       filterItems={filterItems}/>}
    </StyledReserveWrap>);
};

const StyledReserveWrap = styled.div<{
    type: string;
    ref: Ref<HTMLElement>;
    children: ReactNode;
}>`
  flex: 1;
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  button {
    display: block;
    flex-wrap: wrap;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    text-align: left;
    ${props => props.type !== ViewType.Month && `
      overflow: hidden;
      text-align: center;
    `};

    @media (max-width: 767px) {
      > span {
        ${props => props.type === ViewType.Week && `
          white-space: wrap;
          word-break: break-all;
          
          &:first-of-type,
          &:last-of-type {
            display: none;
          }`}
      }
    }

    @media (min-width: 768px) {
      > span {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
`;
