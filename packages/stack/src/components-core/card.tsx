'use client';

import * as React from "react";
import { useDesign } from "../providers/design-provider";
import styled from 'styled-components';

const StyledCard = styled.div<{ 
  backgroundColor: string, 
  borderColor: string, 
}>`
  border-radius: 0.75rem;
  border: 1px solid ${props => props.borderColor};
  background-color: ${props => props.backgroundColor};
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
  padding: 1.5rem;
`;

export type CardProps = React.HTMLProps<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
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

export default Card;