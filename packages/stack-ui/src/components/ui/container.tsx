'use client';

import React from 'react';
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

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(({
  size,
  ...props
}, ref) => {
  return (
    <OuterContainer>
      <InnerContainer
        $breakpoint={size}
        {...props}
        ref={ref}
      >
        {props.children}
      </InnerContainer>
    </OuterContainer>
  );
});

export { Container };