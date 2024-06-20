'use client';

import { useDesign } from "../../providers/design-provider";
import styled from 'styled-components';

type ContainerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number,
} & Omit<React.HTMLProps<HTMLDivElement>, 'size'>

const OuterContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const InnerContainer = styled.div<{ $breakpoint: number }>`
  width: 100%;
  @media (min-width: ${props => props.$breakpoint}px) {
    width: ${props => props.$breakpoint}px;
  }
`;

export function Container({
  size='md',
  ...props
} : ContainerProps) {
  const { breakpoints } = useDesign();
  return (
    <OuterContainer>
      <InnerContainer
        $breakpoint={typeof size === 'number' ? size : breakpoints[size]}
        {...props}
      >
        {props.children}
      </InnerContainer>
    </OuterContainer>
  );
}