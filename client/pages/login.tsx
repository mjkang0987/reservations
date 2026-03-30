import {useEffect} from 'react';

import {useRouter} from 'next/router';

import {signIn, useSession} from 'next-auth/react';

import styled from 'styled-components';

export default function LoginPage() {
    const {status} = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/');
        }
    }, [status, router]);

    if (status === 'loading' || status === 'authenticated') {
        return null;
    }

    return (
        <StyledWrapper>
            <StyledCard>
                <StyledTitle>RESERVATION</StyledTitle>
                <StyledSubtitle>SNS 계정으로 로그인</StyledSubtitle>
                <StyledButtonGroup>
                    <StyledButton
                        type="button"
                        $bg="#fff"
                        $color="#333"
                        $border="#ddd"
                        onClick={() => signIn('google', {callbackUrl: '/'})}
                    >
                        Google 로그인
                    </StyledButton>
                    <StyledButton
                        type="button"
                        $bg="#FEE500"
                        $color="#191919"
                        $border="#FEE500"
                        onClick={() => signIn('kakao', {callbackUrl: '/'})}
                    >
                        카카오 로그인
                    </StyledButton>
                    <StyledButton
                        type="button"
                        $bg="#03C75A"
                        $color="#fff"
                        $border="#03C75A"
                        onClick={() => signIn('naver', {callbackUrl: '/'})}
                    >
                        네이버 로그인
                    </StyledButton>
                </StyledButtonGroup>
            </StyledCard>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #f5f5f5;
`;

const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 30px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 360px;
`;

const StyledTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #333;
`;

const StyledSubtitle = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0 0 30px;
`;

const StyledButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const StyledButton = styled.button<{$bg: string; $color: string; $border: string}>`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${(props) => props.$border};
  background-color: ${(props) => props.$bg};
  color: ${(props) => props.$color};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
`;
