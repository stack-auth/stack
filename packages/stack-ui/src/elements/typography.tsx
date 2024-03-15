'use client';

import React from "react";
import { createElement } from "react";
import { FONT_FAMILY, FONT_SIZES, PRIMARY_FONT_COLORS, SECONDARY_FONT_COLORS } from "../utils/constants";
import { useDesign } from "../utils/design-provider";

export type TypographyProps = {
  color?: 'primary' | 'secondary' | 'warning' | 'success' | string,
  as?: 'p' | 'h6'| 'h5' | 'h4' | 'h3' | 'h2' | 'h1',
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
} & Omit<React.HTMLProps<HTMLParagraphElement>, 'size'>

const Typography = React.forwardRef<HTMLParagraphElement, TypographyProps>(({
  color='primary',
  size='md',
  as='p',
  style,
  ...props
} : TypographyProps) => {
  const { currentTheme } = useDesign();

  let textColor;
  switch (color) {
    case 'primary': {
      textColor = PRIMARY_FONT_COLORS[currentTheme];
      break;
    }
    case 'secondary': {
      textColor = SECONDARY_FONT_COLORS[currentTheme];
      break;
    }
    case 'warning': {
      textColor = '#ff4500';
      break;
    }
    case 'success': {
      textColor = '#32cd32';
      break;
    }
    default: {
      textColor = color;
      break;
    }
  }

  return createElement(
    as,
    {
      style: {
        fontSize: FONT_SIZES[size],
        fontFamily: FONT_FAMILY,
        color: textColor,
        padding: 0,
        margin: 0,
        ...style
      },
      ...props
    },
    props.children
  );
});
Typography.displayName = 'Typography';

export default Typography;