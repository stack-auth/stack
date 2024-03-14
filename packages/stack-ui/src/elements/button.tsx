import React from "react";
import { useDesign } from "../utils/provider";
import Color from 'color';
import styled from 'styled-components';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZES } from "../utils/constants";

function getColors(color: string, primaryBgColor: string): { 
  bgColor: string, 
  hoverBgColor: string,
  activeBgColor: string,
  textColor: string,
} {
  const c = Color(color);
  const pc = Color(primaryBgColor);
  if (c.alpha() === 0) {
    return {
      bgColor: 'transparent',
      hoverBgColor: pc.isLight() ? Color('black').alpha(0.1).toString() : Color('white').alpha(0.1).toString(),
      activeBgColor: pc.isLight() ? Color('black').alpha(0.2).toString() : Color('white').alpha(0.2).toString(),
      textColor: pc.isLight() ? 'black' : 'white',
    };
  } else if (c.isLight()) {
    return {
      bgColor: color,
      hoverBgColor: c.darken(0.2).toString(),
      activeBgColor: c.darken(0.4).toString(),
      textColor: 'black',
    };
  } else {
    return {
      bgColor: color,
      hoverBgColor: c.lighten(0.2).toString(),
      activeBgColor: c.lighten(0.4).toString(),
      textColor: 'white',
    };
  }
}

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'plain' | 'destructive',
  size?: 'sm' | 'md' | 'lg',
  loading?: boolean,
} & Omit<React.HTMLProps<HTMLButtonElement>, 'size' | 'type'>

const StyledButton = styled.button<{
  $size: 'sm' | 'md' | 'lg',
  $bgColor: string, 
  $hoverBgColor: string,
  $activeBgColor: string,
  $textColor: string,
}>`
  border: 0;
  border-radius: ${BORDER_RADIUS};
  padding: ${props => {
    switch (props.$size) {
      case 'sm': return '0.5rem 0.75rem';
      case 'md': return '0.5rem 1rem';
      case 'lg': return '0.5rem 2rem';
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'sm': return '2.25rem';
      case 'md': return '2.5rem';
      case 'lg': return '2.75rem';
    }
  }};
  font-size: ${FONT_SIZES.md};
  background-color: ${props => props.$bgColor};
  color: ${props => props.$textColor};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: background-color 0.2s;
  cursor: pointer;
  &:not([disabled]) {
    &:active,&:hover:active {
      background-color: ${props => props.$activeBgColor};
    }
    &:hover {
      background-color: ${props => props.$hoverBgColor};
    }
  }
  &:disabled {
    cursor: auto;
    opacity: 0.5;
  }
  font-family: ${FONT_FAMILY};
`;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant='primary',
    size='md',
    loading=false,
    disabled=false,
    ...props
  }, ref) => {
    const { colors } = useDesign();
    let bgColor;
    switch (variant) {
      case 'primary':
        bgColor = colors.primaryColor;
        break;
      case 'secondary':
        bgColor = colors.secondaryColor;
        break;
      case 'plain':
        bgColor = 'transparent';
        break;
      case 'destructive':
        bgColor = '#ff4500';
        break;
    }
    const buttonColors = getColors(bgColor, colors.primaryBgColor);
  
    return (
      <StyledButton
        ref={ref}
        $size={size}
        $bgColor={buttonColors.bgColor}
        $hoverBgColor={buttonColors.hoverBgColor}
        $activeBgColor={buttonColors.activeBgColor}
        $textColor={buttonColors.textColor}
        disabled={disabled || loading}
        {...props}
      >
        {props.children}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;