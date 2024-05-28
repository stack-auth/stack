'use client';

import React, { useMemo } from "react";
import { useDesign } from "../providers/design-provider";
import Color from 'color';
import styled from 'styled-components';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZES } from "../utils/constants";
import LoadingIndicator from "./loading-indicator";

function getColors({
  propsColor, 
  colors, 
  variant, 
}: {
  propsColor?: string, 
  colors: { primaryColor: string, secondaryColor: string, backgroundColor: string },
  variant: 'primary' | 'secondary' | 'warning',
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
  variant?: 'primary' | 'secondary' | 'warning',
  color?: string,
  size?: 'sm' | 'md' | 'lg',
  type?: 'button' | 'submit' | 'reset',
  loading?: boolean,
  onClick?: (() => void) | (() => Promise<void>),
} & Omit<React.HTMLProps<HTMLButtonElement>, 'size' | 'type' | 'onClick'>

type ButtonColors = {
  bgColor: string, 
  hoverBgColor: string,
  activeBgColor: string,
  textColor: string,
}

const StyledButton = styled.button<{
  $size: 'sm' | 'md' | 'lg',
  $loading: boolean,
  $colors: {
    dark: ButtonColors,
    light: ButtonColors,
  },
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
  font-family: ${FONT_FAMILY};
  font-size: ${FONT_SIZES.md};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: background-color 0.05s;
  cursor: pointer;
  position: relative;
  &:disabled {
    cursor: auto;
    opacity: 0.5;
  }

  background-color: ${props => props.$colors.light.bgColor};
  color: ${props => props.$colors.light.textColor};
  &:not([disabled]) {
    &:active,&:hover:active {
      background-color: ${props => props.$colors.light.activeBgColor};
    }
    &:hover {
      background-color: ${props => props.$colors.light.hoverBgColor};
    }
  }

  html[data-stack-theme='dark'] & {
    background-color: ${props => props.$colors.dark.bgColor};
    color: ${props => props.$colors.dark.textColor};
    &:not([disabled]) {
      &:active,&:hover:active {
        background-color: ${props => props.$colors.dark.activeBgColor};
      }
      &:hover {
        background-color: ${props => props.$colors.dark.hoverBgColor};
      }
    }
  }
`;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant='primary',
    size='md',
    loading=false,
    ...props
  }, ref) => {
    const { colors } = useDesign();

    const { dark, light } = useMemo(() => {
      return {
        dark: getColors({ propsColor: props.color, colors: colors.dark, variant }),
        light: getColors({ propsColor: props.color, colors: colors.light, variant }),
      };
    }, [props.color, colors, variant]);

    return (
      <StyledButton
        ref={ref}
        $size={size}
        $loading={loading}
        $colors={{ dark, light }}
        {...props}
      >
        <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', visibility: loading ? 'visible' : 'hidden' }}>
          <LoadingIndicator color={{ light: light.textColor, dark: dark.textColor }}/>
        </span>
        <span style={{ visibility: loading ? 'hidden' : 'visible', whiteSpace: 'nowrap' }}>
          {props.children}
        </span>
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

export {
  Button,
};
