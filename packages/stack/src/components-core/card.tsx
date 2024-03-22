'use client';

import * as React from "react";
import { useDesign } from "../providers/design-provider";
import styled from 'styled-components';

const StyledCard = styled.div<{ 
  backgroundColor: string, 
  borderColor: string, 
}>`
  border-radius: 1rem;
  border: 1px solid ${props => props.borderColor};
  background-color: ${props => props.backgroundColor};
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
`;

export type CardProps = React.HTMLProps<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => {
    const { colors, colorMode } = useDesign();
    return <StyledCard 
      ref={ref} 
      {...props} 
      backgroundColor={colors.backgroundColor} 
      borderColor={colors.neutralColor}
    />;
  }
);
Card.displayName = "Card";

const StyledCardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
`;

export type CardHeaderProps = React.HTMLProps<HTMLDivElement>;

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>((props, ref) => (
  <StyledCardHeader ref={ref} {...props} />
));
CardHeader.displayName = "CardHeader";

const StyledCardContent = styled.div`
  padding: 1.5rem;
  padding-top: 0;
`;

export type CardContentProps = React.HTMLProps<HTMLDivElement>;

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>((props, ref) => (
  <StyledCardContent ref={ref} {...props} />
));
CardContent.displayName = "CardContent";

const StyledCardFooter = styled.div`
  display: flex;
  align-items: center;
  padding: 1.5rem;
  padding-top: 0;
`;

export type CardFooterProps = React.HTMLProps<HTMLDivElement>;

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>((props, ref) => (
  <StyledCardFooter ref={ref} {...props} />
));
CardFooter.displayName = "CardFooter";
