'use client';

import styled from 'styled-components';

type ContainerProps = {
  size: number,
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
  size,
  ...props
} : ContainerProps) {
  return (
    <OuterContainer>
      <InnerContainer
        $breakpoint={size}
        {...props}
      >
        {props.children}
      </InnerContainer>
    </OuterContainer>
  );
}