'use client';

import React from "react";
import { useDesign } from "../providers/design-provider";
import Color from 'color';
import styled from 'styled-components';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZES } from "../utils/constants";

function getColors(color: string, backgroundColor: string): { 
  bgColor: string, 
  hoverBgColor: string,
  activeBgColor: string,
  textColor: string,
} {
  const c = Color(color);
  const pc = Color(backgroundColor);

  const changeColor = (value: number) => {
    return c.hsl(c.hue(), c.saturationl(), c.lightness() + value).toString();
  };
  
  const getAlpha = (alpha: number) => {
    return Color(
      pc.isDark() ? 'white' : 'black'
    ).alpha(alpha).toString();
  };

  if (c.alpha() === 0) {
    return {
      bgColor: 'transparent',
      hoverBgColor: getAlpha(0.1),
      activeBgColor: getAlpha(0.2),
      textColor: pc.isLight() ? 'black' : 'white',
    };
  } else if (c.isLight()) {
    return {
      bgColor: color,
      hoverBgColor: changeColor(-10),
      activeBgColor: changeColor(-20),
      textColor: 'black',
    };
  } else {
    return {
      bgColor: color,
      hoverBgColor: changeColor(10),
      activeBgColor: changeColor(20),
      textColor: 'white',
    };
  }
}

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'warning',
  color?: string,
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
      case 'sm': { return '0rem 0.75rem'; }
      case 'md': { return '0rem 1rem'; }
      case 'lg': { return '0rem 2rem'; }
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'sm': { return '2rem'; }
      case 'md': { return '2.5rem'; }
      case 'lg': { return '3rem'; }
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
      case 'primary': {
        bgColor = colors.primaryColor;
        break;
      }
      case 'secondary': {
        bgColor = colors.secondaryColor;
        break;
      }
      case 'warning': {
        bgColor = '#ff4500';
        break;
      }
    }
    if (props.color) {
      bgColor = props.color;
    }
    const buttonColors = getColors(bgColor, colors.backgroundColor);
  
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