import {useRouter} from 'next/router';

import styled from 'styled-components';

import {SeoHead} from '../components/ui/SeoHead';

export default function PrivacyPage() {
    const router = useRouter();

    return (
        <StyledWrapper>
            <SeoHead title="개인정보처리방침" />
            <StyledDoc>
                <StyledHeader>
                    <h1>개인정보처리방침</h1>
                    <button type="button" onClick={() => router.back()}>닫기</button>
                </StyledHeader>
                <StyledBody>
                    <p>개인정보처리방침 내용은 준비 중입니다.</p>
                </StyledBody>
            </StyledDoc>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
    display: flex;
    justify-content: center;
    height: 100%;
    overflow-y: auto;
    padding: 24px 16px;
    box-sizing: border-box;
`;

const StyledDoc = styled.article`
    width: 100%;
    max-width: 720px;
`;

const StyledHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    h1 {
        font-size: 22px;
        font-weight: 700;
        margin: 0;
        color: var(--black-color);
    }

    button {
        padding: 8px 14px;
        border: 1px solid var(--light-gray-color);
        border-radius: 8px;
        background: var(--white-color);
        font-size: 13px;
        font-weight: 600;
        color: var(--dark-gray-color2);
        cursor: pointer;
    }
`;

const StyledBody = styled.div`
    font-size: 14px;
    line-height: 1.7;
    color: var(--dark-gray-color);
    word-break: keep-all;
`;
