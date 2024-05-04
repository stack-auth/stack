'use client';

import React from "react";
import { createElement } from "react";
import { FONT_FAMILY, FONT_SIZES, LINE_HEIGHTS, PRIMARY_FONT_COLORS, SECONDARY_FONT_COLORS } from "../utils/constants";
import styled from "styled-components";
import { typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";

const components = ['p', 'h6', 'h5', 'h4', 'h3', 'h2', 'h1'] as const;
const StyledComponents = typedFromEntries(components.map((component) => {
  return [
    component,
    styled(component)<{
      $size: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
      $textColor: { light: string, dark: string },
    }>`
      font-family: ${FONT_FAMILY};
      font-size: ${props => FONT_SIZES[props.$size]};
      line-height: ${props => LINE_HEIGHTS[props.$size]};
      margin: 0;
      padding: 0;
      color: ${props => props.$textColor.light};
      
      html[data-theme='dark'] & {
        color: ${props => props.$textColor.dark};
      }
    `
  ] as const;
}));


type TextProps = {
  variant?: 'primary' | 'secondary' | 'warning' | 'success',
  as?: 'p' | 'h6'| 'h5' | 'h4' | 'h3' | 'h2' | 'h1',
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
} & Omit<React.HTMLProps<HTMLParagraphElement>, 'size'>

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(({
  variant='primary',
  size='md',
  as='p',
  ...props
} : TextProps, ref) => {
  let textColor: { light: string, dark: string };
  switch (variant) {
    case 'primary': {
      textColor = PRIMARY_FONT_COLORS;
      break;
    }
    case 'secondary': {
      textColor = SECONDARY_FONT_COLORS;
      break;
    }
    case 'warning': {
      textColor = { light: '#b33b1d', dark: '#ff7b5c' };
      break;
    }
    case 'success': {
      textColor = { light: '#3da63d', dark: '#3da63d' };
      break;
    }
  }
  return createElement(StyledComponents[as], {
    $size: size,
    $textColor: textColor,
    ...props,
    ref,
  });
});

Text.displayName = 'Text';

export { Text };