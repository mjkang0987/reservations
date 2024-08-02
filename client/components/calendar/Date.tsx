import React, {
    useRef
} from 'react';

import styled from 'styled-components';

import {
    useRecoilState,
    useRecoilValue,
    useSetRecoilState
} from 'recoil';
import {
    currReservationsState,
    dragTargetState,
    ReservationsType,
    targetStateState,
    todayState,
    viewState
} from '../../recoil/atoms';

import {
    ViewType
} from '../../utils/constants';

import {
    isTodayValue,
    filterReservations
} from '../../utils/utils';

import {TimelineComponent} from './Timeline';
import {Num} from './Num';
import {ReservationsComponents} from '../reservation/Reservations';

interface MonthType {
    arrayDates: number[];
    currMonth: number;
    type: string;
}

export const DateComponent = ({
    arrayDates,
    currMonth,
    type
}: MonthType) => {
    const today = useRecoilValue(todayState);
    const [curr, setCurr] = useRecoilState(targetStateState);

    const currReservations = useRecoilValue(currReservationsState);

    const setDragTarget = useSetRecoilState(dragTargetState);
    const reservationRef = useRef<HTMLSpanElement[] | null[]>([]);

    const {
        fullYear
    } = curr;

    const setView = useSetRecoilState(viewState);

    let items: ReservationsType[] | [] = [];

    const setFilterItems = (val: number) => {
        const filterItems = filterReservations({
            reservations: currReservations,
            fullYear,
            currMonth   : currMonth + 1,
            currDate    : +val
        });

        items = [...filterItems];
        return items;
    };

    interface DragOverType {
        event: React.MouseEvent;
        index: number;
        date: number;
    }

    const handlerDragOver = ({event, index, date}: DragOverType) => {
        event.preventDefault();
        setDragTarget({
            element  : reservationRef.current[index],
            arrayDate: [fullYear, currMonth, date]
        });
    };

    return (<>
        {arrayDates.map((val, index) =>
            <StyledDate key={`month_${val + index}`}
                        type={type}
                        ref={(element) => reservationRef.current[index] = element}
                        onDragOver={(e) => {
                            handlerDragOver({
                                event: e,
                                index,
                                date: +val
                            });
                        }}>
                <StyledNumWrap>
                    <Num onClick={() => {
                        setCurr(new Date(fullYear, currMonth, val));
                        setView({type: ViewType.Day});
                    }}
                         isToday={isTodayValue(today, fullYear, currMonth, +val)}>{val}</Num>
                </StyledNumWrap>
                {type !== ViewType.Month &&
                    <TimelineComponent fullYear={fullYear}
                                       month={currMonth}
                                       date={+val}
                                       isToday={isTodayValue(today, fullYear, currMonth, +val)}>
                        {setFilterItems(val).length > 0 && <ReservationsComponents items={items}/>}
                    </TimelineComponent>}

                {(type === ViewType.Month && setFilterItems(val).length > 0) && <ReservationsComponents items={items}/>}
            </StyledDate>)}
    </>);
};

const StyledDate = styled.li<{ type: string }>`
  ${props => props.type !== ViewType.Month
             ? `
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  text-align: center;
  
  &:nth-child(7) {
    &:after {
      display: none;
    }
  }

  &:after {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    width: 1px;
    height: 100%;
    background-color: var(--light-gray-color);
  }
  
  > span {
    background-color: var(--white-color-80);
  
    &:after {
      content: "";
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      height: 50px;
      background: linear-gradient(0deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, .8) 100%);
      pointer-events: none;
    }
  }
  `
             : `
  display: flex;
  flex-direction: column;
  text-align: center;
  border-right: 1px solid var(--light-gray-color);
  border-top: 1px solid var(--light-gray-color);
  
  @media (max-width: 767px) {
    padding: 2px;
    font-size: var(--tiny-font);
  }
  @media (min-width: 768px) {
    padding: 5px;
    font-size: var(--default-font);
  }
  
  &:nth-child(7n) {
    border-right: none;
  }

  &:nth-child(-n+7) {
    border-top: none;
  }
  `};

  button {
    @media (max-width: 767px) {
      font-size: var(--tiny-font);
    }
    @media (min-width: 768px) {
      font-size: var(--default-font);
    }
  }
`;

const StyledNumWrap = styled.span`
  display: flex;
  justify-content: center;
  position: sticky;
  width: 100%;
  z-index: 1;

  @media (max-width: 767px) {
    top: 30px;
  }
  @media (min-width: 768px) {
    top: 35px;
  }
`;