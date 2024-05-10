'use client';

import * as React from "react";
import styled from "styled-components";
import { useDesign } from "..";
import { ColorPalette } from "../providers/design-provider";

const StyledCard = styled.div<{ 
  $colors: ColorPalette,
}>`
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  padding: 1.5rem;

  border: 1px solid ${props => props.$colors.light.neutralColor};
  background-color: ${props => props.$colors.light.backgroundColor};

  html[data-stack-theme='dark'] & {
    border-color: ${props => props.$colors.dark.neutralColor};
    background-color: ${props => props.$colors.dark.backgroundColor};
  }
`;

const StyledCardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
`;

const StyledCardContent = styled.div`
`;

const StyledCardFooter = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1.5rem;
`;

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  const { colors } = useDesign();
  return <StyledCard ref={ref} {...props} $colors={colors} />;
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <StyledCardHeader ref={ref} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <StyledCardContent ref={ref} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <StyledCardFooter ref={ref} {...props} />
));
CardFooter.displayName = "CardFooter";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardContent,
};
