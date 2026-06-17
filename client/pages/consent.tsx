import {useEffect, useState} from 'react';

import Link from 'next/link';
import {useRouter} from 'next/router';

import {signOut, useSession} from 'next-auth/react';

import styled from 'styled-components';

import {ConfirmDialog} from '../components/ui/ConfirmDialog';
import {LoadingOverlay} from '../components/ui/LoadingOverlay';
import {SeoHead} from '../components/ui/SeoHead';
import {CURRENT_TERMS_VERSION} from '../utils/terms';
import {getGuestTermsVersion, setGuestTermsAgreed} from '../lib/local-db';

function getMonthEntryPath(): string {
    const today = new Date();
    return `/month/${today.getFullYear()}/${today.getMonth() + 1}`;
}

export default function ConsentPage() {
    const {data: session, status, update} = useSession();
    const router = useRouter();

    const isGuest = status === 'unauthenticated';

    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

    const alreadyAgreed = isGuest
        ? getGuestTermsVersion() === CURRENT_TERMS_VERSION
        : session?.user?.termsVersion === CURRENT_TERMS_VERSION;

    // 동의 후 돌아갈 경로: 슬래시 경로(/consent/<경로>)에서 추출, 없으면 월 진입
    const resolveNextPath = () => {
        const rest = router.asPath.slice('/consent'.length);
        const next = rest.startsWith('/') && !rest.startsWith('//') ? rest : null;
        return next ?? getMonthEntryPath();
    };

    // 로그인 에러 → 로그인, 이미 동의 → 원래 가려던 곳(슬래시 경로)으로
    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'authenticated' && session?.user?.loginError) {
            router.replace('/login');
            return;
        }
        if (alreadyAgreed) {
            router.replace(resolveNextPath());
        }
        // resolveNextPath는 router 기반이라 deps에 router만 있으면 충분
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, alreadyAgreed, session, router]);

    const allChecked = agreeTerms && agreePrivacy;
    const toggleAll = (checked: boolean) => {
        setAgreeTerms(checked);
        setAgreePrivacy(checked);
    };

    const handleAgree = async () => {
        if (!allChecked || submitting) return;
        setSubmitting(true);
        setError(null);

        // 게스트: localStorage에 동의 기록 (DB 계정 없음) 후 원래 가려던 곳으로 복귀
        if (isGuest) {
            setGuestTermsAgreed(CURRENT_TERMS_VERSION);
            router.replace(resolveNextPath());
            return;
        }

        try {
            const res = await fetch('/api/consent', {method: 'POST'});
            if (!res.ok) throw new Error('consent failed');
            // 세션(JWT) 갱신 → termsVersion 반영 후 진입
            await update();
            router.replace(resolveNextPath());
        } catch {
            setError('동의 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
            setSubmitting(false);
        }
    };

    const handleDecline = () => {
        if (submitting) return;
        setShowDeclineConfirm(true);
    };

    const confirmDecline = () => {
        setShowDeclineConfirm(false);

        if (isGuest) {
            router.replace('/login');
            return;
        }

        setSubmitting(true);
        void signOut({callbackUrl: '/login'});
    };

    if (status === 'loading') {
        return <LoadingOverlay text="로그인 상태 확인 중..." />;
    }
    // 동의 직후/이미 동의: 다음 화면으로 이동하는 동안 안내 문구 노출
    if (alreadyAgreed) {
        return <LoadingOverlay text="서비스를 준비하는 중..." />;
    }

    return (
        <StyledWrapper>
            <SeoHead title="약관 동의" />
            <StyledCard>
                <StyledTitle>약관 동의</StyledTitle>
                <StyledSubtitle>TAS 이용을 위해 아래 약관에 동의해 주세요.</StyledSubtitle>

                <StyledAllRow>
                    <StyledCheckbox
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => toggleAll(e.target.checked)}
                    />
                    <StyledAllLabel>전체 동의</StyledAllLabel>
                </StyledAllRow>

                <StyledDivider />

                <StyledItem>
                    <StyledCheckbox
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <StyledItemText>
                        <StyledRequired>(필수)</StyledRequired> 이용약관 동의
                    </StyledItemText>
                    <StyledViewLink href="/terms" target="_blank" rel="noopener noreferrer">
                        보기
                    </StyledViewLink>
                </StyledItem>

                <StyledItem>
                    <StyledCheckbox
                        type="checkbox"
                        checked={agreePrivacy}
                        onChange={(e) => setAgreePrivacy(e.target.checked)}
                    />
                    <StyledItemText>
                        <StyledRequired>(필수)</StyledRequired> {isGuest ? '개인정보 수집·이용 동의' : '개인정보 수집·이용 및 처리위탁 동의'}
                    </StyledItemText>
                    <StyledViewLink href="/privacy" target="_blank" rel="noopener noreferrer">
                        보기
                    </StyledViewLink>
                </StyledItem>

                {error && <StyledError>{error}</StyledError>}

                <StyledPrimaryButton type="button" disabled={!allChecked || submitting} onClick={handleAgree}>
                    {submitting ? '처리 중...' : '동의하고 시작하기'}
                </StyledPrimaryButton>
                <StyledSecondaryButton type="button" disabled={submitting} onClick={handleDecline}>
                    동의 안 함
                </StyledSecondaryButton>
            </StyledCard>

            {showDeclineConfirm && (
                <ConfirmDialog
                    title="약관 동의 안 함"
                    message={
                        isGuest
                            ? '약관에 동의하지 않으면 서비스를 이용할 수 없습니다.'
                            : '약관에 동의하지 않으면 서비스를 이용할 수 없습니다.\n로그아웃하시겠습니까?'
                    }
                    confirmLabel={isGuest ? '나가기' : '로그아웃'}
                    confirmVariant="danger"
                    layerKey="consent-decline"
                    onConfirm={confirmDecline}
                    onClose={() => setShowDeclineConfirm(false)}
                />
            )}
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
`;

const StyledCard = styled.div`
    display: flex;
    flex-direction: column;
    padding: 40px 30px;
    background-color: var(--white-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    width: 100%;
    max-width: 360px;

    @media (max-width: 640px) {
        padding: 28px 20px;
    }
`;

const StyledTitle = styled.h1`
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 6px;
    color: var(--black-color);
`;

const StyledSubtitle = styled.p`
    font-size: 13px;
    color: var(--dark-gray-color2);
    margin: 0 0 24px;
    line-height: 1.5;
`;

const StyledAllRow = styled.label`
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
`;

const StyledAllLabel = styled.span`
    font-size: 15px;
    font-weight: 700;
    color: var(--black-color);
`;

const StyledDivider = styled.div`
    height: 1px;
    background: var(--light-gray-color);
    margin: 14px 0;
`;

const StyledItem = styled.label`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    cursor: pointer;
`;

const StyledItemText = styled.span`
    flex: 1;
    min-width: 0;
    font-size: 14px;
    color: var(--dark-gray-color);
    line-height: 1.4;
`;

const StyledRequired = styled.span`
    color: var(--brand-color);
    font-weight: 600;
`;

const StyledCheckbox = styled.input`
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    accent-color: var(--brand-color);
    cursor: pointer;
`;

const StyledViewLink = styled(Link)`
    flex-shrink: 0;
    font-size: 12px;
    color: var(--dark-gray-color2);
    text-decoration: underline;

    @media (hover: hover) and (pointer: fine) {
        &:hover { color: var(--brand-color); }
    }
`;

const StyledError = styled.p`
    margin: 16px 0 0;
    padding: 10px 8px;
    box-sizing: border-box;
    border: 1px solid #fecaca;
    border-radius: 8px;
    background: #fff1f2;
    color: #9f1239;
    font-size: 13px;
    line-height: 1.5;
    text-align: center;
`;

const StyledPrimaryButton = styled.button`
    width: 100%;
    margin-top: 24px;
    padding: 13px;
    border: none;
    border-radius: 8px;
    background-color: var(--brand-color);
    color: var(--white-color);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s;

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }

    @media (hover: hover) and (pointer: fine) {
        &:not(:disabled):hover { opacity: 0.9; }
    }
`;

const StyledSecondaryButton = styled.button`
    width: 100%;
    margin-top: 10px;
    padding: 12px;
    border: 1px solid var(--dark-gray-color2);
    border-radius: 8px;
    background-color: var(--white-color);
    color: var(--dark-gray-color);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
