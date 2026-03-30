import {useState, useRef} from 'react';

import styled from 'styled-components';
import Link from 'next/link';

import {useCalendarStore} from '../../store/calendarStore';

import {InputWrap} from './Input';

export const Footer = () => {
    const customerMap = useCalendarStore((s) => s.customerMap);
    const setSelectedCustomerId = useCalendarStore((s) => s.setSelectedCustomerId);

    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const customers = Object.values(customerMap);
    const filtered = query.trim()
        ? customers.filter((c) => c.name.includes(query) || c.tel.includes(query))
        : [];

    const handleSelect = (id: number) => {
        setSelectedCustomerId(id);
        setQuery('');
        setShowSuggestions(false);
    };

    const handleFocus = () => {
        clearTimeout(blurTimerRef.current);
        if (query.trim()) setShowSuggestions(true);
    };

    const handleBlur = () => {
        blurTimerRef.current = setTimeout(() => setShowSuggestions(false), 150);
    };

    const handleChange = (value: string) => {
        setQuery(value);
        setShowSuggestions(value.trim().length > 0);
    };

    return (
        <StyledFooter>
            <StyledSearchWrap>
                <InputWrap htmlFor="inputSearch"
                           inputIcon="search">
                    <input type="search"
                           id="inputSearch"
                           autoComplete="off"
                           placeholder="고객명 또는 연락처 검색"
                           value={query}
                           onChange={(e) => handleChange(e.target.value)}
                           onFocus={handleFocus}
                           onBlur={handleBlur}/>
                </InputWrap>
                {showSuggestions && query.trim() && (
                    filtered.length > 0 ? (
                        <StyledSuggestionList role="listbox" id="footer-customer-listbox">
                            {filtered.map((c) => (
                                <StyledSuggestionItem key={c.id}
                                                      role="option"
                                                      onMouseDown={() => handleSelect(c.id)}>
                                    <span>{c.name}</span>
                                    <span>{c.tel}</span>
                                </StyledSuggestionItem>
                            ))}
                        </StyledSuggestionList>
                    ) : (
                        <StyledSuggestionList>
                            <StyledNoResult>검색 결과 없음</StyledNoResult>
                        </StyledSuggestionList>
                    )
                )}
            </StyledSearchWrap>
            <Link href="/address">📖 전체보기</Link>
        </StyledFooter>
    );
};

const StyledFooter = styled.footer`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-top: solid 1px var(--light-gray-color);
  font-size: var(--small-font);
  color: var(--gray-color);
`;

const StyledSearchWrap = styled.div`
  position: relative;
  flex: 1;
`;

const StyledSuggestionList = styled.ul`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  z-index: 10;
  margin: 0 0 4px;
  padding: 4px 0;
  list-style: none;
  background-color: #fff;
  border: 1px solid var(--light-gray-color);
  border-radius: 4px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

const StyledSuggestionItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;

  > span:last-child {
    font-size: 11px;
    color: var(--gray-color);
  }

  &:hover {
    background-color: var(--black-color-10);
  }
`;

const StyledNoResult = styled.li`
  padding: 8px 10px;
  font-size: 12px;
  color: var(--gray-color);
  text-align: center;
`;
