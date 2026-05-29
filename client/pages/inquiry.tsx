import {useState} from 'react';

import type {NextPage} from 'next';
import {useSession} from 'next-auth/react';
import styled from 'styled-components';

import {PageHero} from '../components/ui/PageHero';

const InquiryPage: NextPage = () => {
    const {data: session} = useSession();
    const [name, setName] = useState(session?.user?.name ?? '');
    const [email, setEmail] = useState(session?.user?.email ?? '');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('이름을 입력해 주세요.');
            return;
        }
        if (!content.trim()) {
            setError('문의 내용을 입력해 주세요.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/inquiry', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: name.trim(), email: email.trim(), content: content.trim()}),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || '전송에 실패했습니다.');
                return;
            }
            setSubmitted(true);
        } catch {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <StyledSection>
            <StyledContainer>
                <PageHero eyebrow="INQUIRY" title="문의하기" />
                <StyledCard>
                    {submitted ? (
                        <StyledSuccess>
                            <strong>문의가 접수되었습니다.</strong>
                            <span>확인 후 빠르게 답변드리겠습니다.</span>
                            <StyledResetButton type="button" onClick={() => {
                                setSubmitted(false);
                                setContent('');
                            }}>
                                추가 문의하기
                            </StyledResetButton>
                        </StyledSuccess>
                    ) : (
                        <StyledForm onSubmit={handleSubmit}>
                            <StyledFieldGroup>
                                <label htmlFor="inquiry-name">
                                    <strong>이름 <StyledRequired>*</StyledRequired></strong>
                                </label>
                                <StyledInput
                                    id="inquiry-name"
                                    type="text"
                                    placeholder="이름을 입력해 주세요"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </StyledFieldGroup>
                            <StyledFieldGroup>
                                <label htmlFor="inquiry-email">
                                    <strong>이메일</strong>
                                </label>
                                <StyledInput
                                    id="inquiry-email"
                                    type="email"
                                    placeholder="답변 받으실 이메일 (선택)"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </StyledFieldGroup>
                            <StyledFieldGroup>
                                <label htmlFor="inquiry-content">
                                    <strong>문의 내용 <StyledRequired>*</StyledRequired></strong>
                                </label>
                                <StyledTextarea
                                    id="inquiry-content"
                                    placeholder="문의 내용을 입력해 주세요"
                                    rows={6}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </StyledFieldGroup>
                            {error && <StyledError>{error}</StyledError>}
                            <StyledSubmitButton type="submit" disabled={submitting}>
                                {submitting ? '전송 중...' : '문의 전송'}
                            </StyledSubmitButton>
                        </StyledForm>
                    )}
                </StyledCard>
                <StyledFooterCs>Take a seat CS: <a href="mailto:takeaseat.cs@gmail.com">takeaseat.cs@gmail.com</a></StyledFooterCs>
            </StyledContainer>
        </StyledSection>
    );
};

export default InquiryPage;

const StyledSection = styled.section`
    flex: 1;
    box-sizing: border-box;
`;

const StyledContainer = styled.div`
    width: 100%;
    max-width: 880px;
    margin: 0 auto;
    padding: 8px;
    box-sizing: border-box;
`;

const StyledCard = styled.div`
    margin-top: 8px;
    padding: 10px;
    border: 1px solid #e5e7eb;
    border-radius: var(--card-radius);
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
`;

const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const StyledFieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
        font-size: 13px;
        color: #374151;
    }

    strong {
        font-weight: 600;
    }
`;

const StyledRequired = styled.span`
    color: var(--danger-color);
`;

const StyledInput = styled.input`
    width: 100%;
    padding: 10px 12px;
    box-sizing: border-box;
    border: 1px solid #d1d5db;
    border-radius: var(--radius-md);
    font-size: 14px;
    outline: none;

    &:focus {
        border-color: var(--blue-color);
        box-shadow: 0 0 0 2px rgba(45, 127, 249, 0.15);
    }
`;

const StyledTextarea = styled.textarea`
    width: 100%;
    padding: 10px 12px;
    box-sizing: border-box;
    border: 1px solid #d1d5db;
    border-radius: var(--radius-md);
    font-size: 14px;
    line-height: 1.6;
    resize: vertical;
    outline: none;
    font-family: inherit;

    &:focus {
        border-color: var(--blue-color);
        box-shadow: 0 0 0 2px rgba(45, 127, 249, 0.15);
    }
`;

const StyledError = styled.div`
    padding: 10px 12px;
    border: 1px solid #fecaca;
    border-radius: var(--radius-md);
    background: #fff1f2;
    color: #9f1239;
    font-size: 13px;
`;

const StyledSubmitButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 44px;
    border: none;
    border-radius: var(--radius-lg);
    background: #111827;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (hover: hover) and (pointer: fine) {
        &:hover:not(:disabled) {
            opacity: 0.85;
        }
    }
`;

const StyledSuccess = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 20px;

    strong {
        font-size: 16px;
        color: #111827;
    }

    span {
        font-size: 13px;
        color: #6b7280;
    }
`;

const StyledResetButton = styled.button`
    margin-top: 12px;
    padding: 10px 24px;
    border: 1px solid #d1d5db;
    border-radius: var(--radius-lg);
    background: var(--white-color);
    color: #111827;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
`;

const StyledFooterCs = styled.p`
    margin: auto 0 0;
    padding: 24px 0 0;
    text-align: center;
    font-size: 12px;
    color: var(--dark-gray-color2);

    a {
        color: inherit;
        text-decoration: none;
        font-weight: 600;

        @media (hover: hover) and (pointer: fine) {
            &:hover { text-decoration: underline; }
        }
    }
`;
