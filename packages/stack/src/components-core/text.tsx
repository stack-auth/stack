'use client';

import React from "react";
import { createElement } from "react";
import { FONT_FAMILY, FONT_SIZES, LINE_HEIGHTS, PRIMARY_FONT_COLORS, SECONDARY_FONT_COLORS } from "../utils/constants";
import { useDesign } from "../providers/design-provider";

export type TextProps = {
  variant?: 'primary' | 'secondary' | 'warning' | 'success',
  as?: 'p' | 'h6'| 'h5' | 'h4' | 'h3' | 'h2' | 'h1',
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
} & Omit<React.HTMLProps<HTMLParagraphElement>, 'size'>

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(({
  variant='primary',
  size='md',
  as='p',
  style,
  ...props
} : TextProps, ref) => {
  const { colorMode } = useDesign();

  let textColor;
  switch (variant) {
    case 'primary': {
      textColor = PRIMARY_FONT_COLORS[colorMode];
      break;
    }
    case 'secondary': {
      textColor = SECONDARY_FONT_COLORS[colorMode];
      break;
    }
    case 'warning': {
      textColor = '#b33b1d';
      break;
    }
    case 'success': {
      textColor = '#3da63d';
      break;
    }
  }

  return createElement(
    as,
    {
      style: {
        fontSize: FONT_SIZES[size],
        lineHeight: LINE_HEIGHTS[size],
        fontFamily: FONT_FAMILY,
        color: textColor,
        padding: 0,
        margin: 0,
        ...style
      },
      ref,
      ...props
    },
    props.children
  );
});
Text.displayName = 'Typography';

export default Text;