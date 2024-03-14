'use client';

import { useDesign } from "../utils/provider";
import styled from 'styled-components';

export type GridProps = { 
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
} & Omit<React.HTMLProps<HTMLDivElement>, 'size'>

const OuterContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const InnerContainer = styled.div<{ $breakpoint: number }>`
  width: 100%;
  @media (min-width: ${props => props.$breakpoint}px) {
    width: ${props => props.$breakpoint}px;
  }
`;

export default function Container({
  size='md',
  ...props
} : GridProps) {
  const { breakpoints } = useDesign();
  return (
    <OuterContainer>
      <InnerContainer
        $breakpoint={breakpoints[size]}
        {...props}
      >
        {props.children}
      </InnerContainer>
    </OuterContainer>
  );
}