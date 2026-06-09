import styled from 'styled-components';
import {ColorTag} from './ColorTag';

interface DesignerLabelProps {
    color: string;
    name: string;
    className?: string;
}

export function DesignerLabel({color, name, className}: DesignerLabelProps) {
    return (
        <StyledDesignerLabel $color={color} className={className}>
            {name}
        </StyledDesignerLabel>
    );
}

export const StyledDesignerLabel = styled(ColorTag)``;
