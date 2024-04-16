'use client';

import React from "react";
import { useDesign } from "../providers/design-provider";
import Color from 'color';
import styled from 'styled-components';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZES, LINK_COLORS } from "../utils/constants";
import LoadingIndicator from "./loading-indicator";

function getColors({
  propsColor, 
  colors, 
  variant, 
  colorMode,
}: {
  propsColor?: string, 
  colors: { primaryColor: string, secondaryColor: string, backgroundColor: string },
  variant: 'primary' | 'secondary' | 'warning' | 'link',
  colorMode: 'dark' | 'light',
}): { 
  bgColor: string, 
  hoverBgColor: string,
  activeBgColor: string,
  textColor: string,
} {
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
    case 'link': {
      bgColor = 'transparent';
      break;
    }
  }
  if (propsColor) {
    bgColor = propsColor;
  }

  const c = Color(bgColor);
  const pc = Color(colors.primaryColor);

  const changeColor = (value: number) => {
    return c.hsl(c.hue(), c.saturationl(), c.lightness() + value).toString();
  };
  
  const getAlpha = (alpha: number) => {
    return Color(
      pc.isDark() ? 'white' : 'black'
    ).alpha(alpha).toString();
  };

  if (variant === 'link') {
    return {
      bgColor: 'transparent',
      hoverBgColor: getAlpha(0.1),
      activeBgColor: getAlpha(0.2),
      textColor: LINK_COLORS[colorMode],
    };
  }

  if (c.alpha() === 0) {
    return {
      bgColor: 'transparent',
      hoverBgColor: getAlpha(0.1),
      activeBgColor: getAlpha(0.2),
      textColor: colors.primaryColor,
    };
  } else if (c.isLight()) {
    return {
      bgColor,
      hoverBgColor: changeColor(-10),
      activeBgColor: changeColor(-20),
      textColor: 'black',
    };
  } else {
    return {
      bgColor,
      hoverBgColor: changeColor(10),
      activeBgColor: changeColor(20),
      textColor: 'white',
    };
  }
}

export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'warning' | "link",
  color?: string,
  size?: 'sm' | 'md' | 'lg',
  loading?: boolean,
  onClick?: (() => void) | (() => Promise<void>),
} & Omit<React.HTMLProps<HTMLButtonElement>, 'size' | 'type' | 'onClick'>

const StyledButton = styled.button<{
  $size: 'sm' | 'md' | 'lg',
  $bgColor: string, 
  $hoverBgColor: string,
  $activeBgColor: string,
  $textColor: string,
  $underline: boolean,
  $loading: boolean,
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
  text-decoration: ${props => props.$underline ? 'underline' : 'none'};
  position: relative;
`;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant='primary',
    size='md',
    loading=false,
    ...props
  }, ref) => {
    const { colors, colorMode } = useDesign();
    const buttonColors = getColors({
      propsColor: props.color,
      colors,
      variant,
      colorMode,
    });

    return (
      <StyledButton
        ref={ref}
        $size={size}
        $bgColor={buttonColors.bgColor}
        $hoverBgColor={buttonColors.hoverBgColor}
        $activeBgColor={buttonColors.activeBgColor}
        $textColor={buttonColors.textColor} 
        $underline={variant === 'link'}
        $loading={loading}
        {...props}
      >
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', visibility: loading ? 'visible' : 'hidden' }}>
          <LoadingIndicator color={buttonColors.textColor}/>
        </div>
        <div style={{ visibility: loading ? 'hidden' : 'visible' }}>
          {props.children}
        </div>
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

export {
  Button,
};
