'use client';

import React from "react";
import { createElement } from "react";
import { FONT_FAMILY, FONT_SIZES, PRIMARY_FONT_COLORS, SECONDARY_FONT_COLORS } from "../utils/constants";
import { useDesign } from "../utils/provider";

export type TypographyProps = {
  variant?: 'primary' | 'secondary' | 'warning' | 'success',
  as?: 'p' | 'h6'| 'h5' | 'h4' | 'h3' | 'h2' | 'h1',
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
} & Omit<React.HTMLProps<HTMLParagraphElement>, 'size'>

const Typography = React.forwardRef<HTMLParagraphElement, TypographyProps>(({
  variant='primary',
  size='md',
  as='p',
  style,
  ...props
} : TypographyProps) => {
  const { currentTheme } = useDesign();

  let textColor;
  switch (variant) {
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