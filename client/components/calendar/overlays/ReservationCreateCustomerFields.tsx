import React from 'react';

import styled from 'styled-components';

import type {Customer} from '../../../utils/customers';
import {StyledInlineError} from './ModalStyles';
import {CustomerAutocomplete} from '../../customers/CustomerAutocomplete';

type CustomerMode = 'existing' | 'new';

interface ReservationCreateCustomerFieldsProps {
    customerMode: CustomerMode;
    customerId: number;
    customerQuery: string;
    showSuggestions: boolean;
    filteredCustomers: Customer[];
    newCustomerName: string;
    newCustomerTel: string;
    customerErrorMessage?: string;
    onChangeCustomerMode: (mode: CustomerMode) => void;
    onChangeCustomerQuery: (value: string) => void;
    onFocusCustomerQuery: () => void;
    onBlurCustomerQuery: () => void;
    onSelectCustomer: (id: number) => void;
    onChangeNewCustomerName: (value: string) => void;
    onChangeNewCustomerTel: (value: string) => void;
}

export function ReservationCreateCustomerFields({
    customerMode,
    customerId,
    customerQuery,
    showSuggestions,
    filteredCustomers,
    newCustomerName,
    newCustomerTel,
    customerErrorMessage,
    onChangeCustomerMode,
    onChangeCustomerQuery,
    onFocusCustomerQuery,
    onBlurCustomerQuery,
    onSelectCustomer,
    onChangeNewCustomerName,
    onChangeNewCustomerTel,
}: ReservationCreateCustomerFieldsProps) {
    return (
        <>
            <StyledCustomerModeTabs>
                <StyledCustomerModeButton
                    type="button"
                    $active={customerMode === 'existing'}
                    onClick={() => onChangeCustomerMode('existing')}
                >
                    기존 고객
                </StyledCustomerModeButton>
                <StyledCustomerModeButton
                    type="button"
                    $active={customerMode === 'new'}
                    onClick={() => onChangeCustomerMode('new')}
                >
                    신규 고객
                </StyledCustomerModeButton>
            </StyledCustomerModeTabs>
            {customerMode === 'existing' ? (
                <div>
                    <CustomerAutocomplete
                        id="create-customer"
                        query={customerQuery}
                        showSuggestions={showSuggestions}
                        filteredCustomers={filteredCustomers}
                        selectedId={customerId}
                        onChangeQuery={onChangeCustomerQuery}
                        onFocus={onFocusCustomerQuery}
                        onBlur={onBlurCustomerQuery}
                        onSelect={onSelectCustomer}
                    />
                    {customerErrorMessage && <StyledInlineError>{customerErrorMessage}</StyledInlineError>}
                </div>
            ) : (
                <StyledNewCustomerFields>
                    <label htmlFor="create-new-customer-name">
                        <strong>고객명</strong>
                        <input
                            id="create-new-customer-name"
                            type="text"
                            placeholder="신규 고객명"
                            value={newCustomerName}
                            onChange={(e) => onChangeNewCustomerName(e.target.value)}
                        />
                    </label>
                    <label htmlFor="create-new-customer-tel">
                        <strong>연락처</strong>
                        <input
                            id="create-new-customer-tel"
                            type="tel"
                            placeholder="01012345678"
                            value={newCustomerTel}
                            onChange={(e) => onChangeNewCustomerTel(e.target.value)}
                        />
                    </label>
                    {customerErrorMessage && <StyledInlineError>{customerErrorMessage}</StyledInlineError>}
                </StyledNewCustomerFields>
            )}
        </>
    );
}

const StyledCustomerModeTabs = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledCustomerModeButton = styled.button<{ $active: boolean }>`
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid ${({$active}) => $active ? 'var(--blue-color)' : 'var(--light-gray-color)'};
  border-radius: 999px;
  background: ${({$active}) => $active ? 'var(--blue-color)' : 'var(--white-color)'};
  color: ${({$active}) => $active ? 'var(--white-color)' : 'var(--dark-gray-color)'};
  font-size: 12px;
`;

const StyledNewCustomerFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

