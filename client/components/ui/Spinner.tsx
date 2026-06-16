import styled, {keyframes} from 'styled-components';

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

// 공통 로딩 스피너 (회전 원형). 크기·두께·색은 transient prop으로 조정.
export const Spinner = styled.span<{
    $size?: number;
    $thickness?: number;
    $color?: string;
    $track?: string;
}>`
    display: inline-block;
    box-sizing: border-box;
    width: ${(p) => p.$size ?? 36}px;
    height: ${(p) => p.$size ?? 36}px;
    border: ${(p) => p.$thickness ?? 3}px solid ${(p) => p.$track ?? 'var(--light-gray-color)'};
    border-top-color: ${(p) => p.$color ?? 'var(--brand-color)'};
    border-radius: 50%;
    animation: ${spin} 0.7s linear infinite;
`;
