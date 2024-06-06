'use client';

import React, { useMemo } from "react";
import { useDesign } from "../providers/design-provider";
import Color from 'color';
import styled, { keyframes } from 'styled-components';
import { FONT_FAMILY, FONT_SIZES, LINE_HEIGHTS } from "../utils/constants";
import { ReloadIcon } from "@radix-ui/react-icons";

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
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 0;
  border-radius: 0.375rem;
  font-family: ${FONT_FAMILY};
  font-size: ${FONT_SIZES.sm};
  font-weight: 500;
  line-height: ${LINE_HEIGHTS.sm};
  cursor: pointer;
  padding: ${props => {
    switch (props.$size) {
      case 'sm': { return '0rem 0.75rem'; }
      case 'md': { return '0.5rem 1rem'; }
      case 'lg': { return '0.5rem 2rem'; }
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'sm': { return '2rem'; }
      case 'md': { return '2.25rem;'; }
      case 'lg': { return '2.5rem;'; }
    }
  }};
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

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const StyledReloadIcon = styled(ReloadIcon)`
  margin-right: 0.5rem; /* mr-2 */
  height: 1rem; /* h-4 */
  width: 1rem; /* w-4 */
  animation: ${spin} 1s linear infinite; /* animate-spin */
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
        disabled={props.disabled || loading}
      >
        {loading && <StyledReloadIcon />}
        {props.children}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

export {
  Button,
};
