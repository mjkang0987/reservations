import styled from 'styled-components';

import {
    getGroupedCatalog,
    joinServiceNames,
    formatDuration,
    SERVICE_COLOR_MAP
} from '../../utils/services';

interface ServiceFieldsProps {
    selectedServices: string[];
    onServiceToggle: (serviceName: string) => void;
    totalDuration: number;
    idPrefix: string;
}

export const ServiceFields = ({selectedServices, onServiceToggle, totalDuration, idPrefix}: ServiceFieldsProps) => {
    const groupedCatalog = getGroupedCatalog();

    return (
        <StyledServiceArea>
            <StyledServiceList>
                {[...groupedCatalog.entries()].map(([category, items]) => (
                    <StyledServiceGroup key={category}>
                        <StyledCategoryHeader>{category}</StyledCategoryHeader>
                        {items.map((item) => (
                            <StyledServiceCheckbox key={item.name} htmlFor={`${idPrefix}-service-${item.name}`}>
                                <input type="checkbox"
                                       id={`${idPrefix}-service-${item.name}`}
                                       checked={selectedServices.includes(item.name)}
                                       onChange={() => onServiceToggle(item.name)}/>
                                <StyledColorDot $color={SERVICE_COLOR_MAP[item.name] || '#999'}/>
                                <span>{item.name}</span>
                                <StyledDuration>{formatDuration(item.durationMinutes)}</StyledDuration>
                            </StyledServiceCheckbox>
                        ))}
                    </StyledServiceGroup>
                ))}
            </StyledServiceList>
            {selectedServices.length > 0 && (
                <StyledServiceSummary>
                    {joinServiceNames(selectedServices)} ({formatDuration(totalDuration)})
                </StyledServiceSummary>
            )}
        </StyledServiceArea>
    );
};

export const StyledServiceArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StyledServiceList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--light-gray-color);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StyledServiceGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledCategoryHeader = styled.div`
    font-size: 11px;
    font-weight: 600;
    color: var(--dark-gray-color);
    padding: 8px;
    border-bottom: 1px solid var(--light-gray-color);
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: var(--white-color);
`;

export const StyledServiceCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    margin: 0;
    cursor: pointer;
  }

  > span {
    color: var(--dark-gray-color);
  }
`;

export const StyledColorDot = styled.span<{ $color: string }>`
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
`;

export const StyledDuration = styled.span`
  margin-left: auto;
  font-size: 11px;
  color: var(--gray-color);
`;

export const StyledServiceSummary = styled.div`
  font-size: 12px;
  color: var(--blue-color);
  padding: 6px 8px;
  background-color: var(--black-color-10);
  border-radius: 4px;
  word-break: break-all;
`;
