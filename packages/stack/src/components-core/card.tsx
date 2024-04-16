'use client';

import * as React from "react";
import styled from "styled-components";
import { useDesign } from "..";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  const { colors } = useDesign();
  return <StyledCard ref={ref} {...props} backgroundColor={colors.backgroundColor} borderColor={colors.neutralColor} />;
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

const StyledCard = styled.div<{ 
  backgroundColor: string, 
  borderColor: string, 
}>`
  border-radius: 0.5rem;
  border: 1px solid ${props => props.borderColor};
  background-color: ${props => props.backgroundColor};
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  padding: 1.5rem;
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

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardContent,
};
