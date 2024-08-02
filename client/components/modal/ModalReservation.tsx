import React, {ReactNode} from 'react';
import styled from 'styled-components';

import {ReservationsType} from '../../recoil/atoms';

import {setTimeText} from '../../utils/utils';
import {COLORS} from '../../utils/constants';

import {ButtonText} from '../common/ButtonText';
import {ButtonSquare} from '../common/Buttons';

export const ModalReservation = ({item}: { item: ReservationsType }) => {
    return (<StyledItems>
            <StyledService>{item.service}</StyledService>
            <StyledItem>
                {setTimeText({
                    startHours  : item.startHours,
                    startMinutes: item.startMinutes
                })} - {setTimeText({
                startHours  : item.endHours,
                startMinutes: item.endMinutes
            })}
            </StyledItem>
            <ButtonSquare padding={['5px']}
                          height={'30px'}
                          backgroundColor={COLORS[+item.color]}>
                <ButtonText a11y={false}
                            fontSize={'var(--font)'}>{item.name}</ButtonText>
            </ButtonSquare>
            <StyledTel href={`tel:${item.tel}`}>{item.tel}</StyledTel>
        </StyledItems>
    );
};

const StyledItems = styled.div`
  display: flex;
  flex-direction: column;

  > button {
    margin-top: 10px;
    align-self: flex-start;
  }
`;

const StyledItem = styled.div`
  margin-top: 10px;
`;

const StyledTel = styled.a<{
    href: string;
    children: ReactNode;
}>`
  margin-top: 10px;
  text-decoration: underline;
`;

const StyledService = styled.strong`
  font-size: var(--big-font);
`;
