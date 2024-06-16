'use client';

import React from "react";
import { Button as DefaultButton } from "../components-core";
import { Button as JoyButton } from '@mui/joy';
import Color from "color";

export const Button = React.forwardRef<
  React.ElementRef<typeof DefaultButton>,
  React.ComponentProps<typeof DefaultButton>
>(({
  variant = "primary",
  color,
  size = "md",
  loading = false,
  ...props
}, ref) => {
  const muiVariant: "primary" | "neutral" | "danger" = ({
    primary: "primary",
    secondary: "neutral",
    warning: "danger",
  } as const)[variant];

  const { children, action, ref: _, ...validProps } = props;
  const c = Color(color);
  const changeColor = (value: number) => {
    return c.hsl(
      c.hue(), 
      c.saturationl(), 
      c.lightness() + (c.isDark() ? value : -value)
    ).toString();
  };

  return <JoyButton
    color={muiVariant}
    sx={color ? {
      backgroundColor: color,
      color: c.isDark() ? 'white' : 'black',
      '&:hover': {
        backgroundColor: changeColor(10)
      },
      '&:active': {
        backgroundColor: changeColor(20)
      },
    } : {}}
    size={size}
    loading={loading}
    {...validProps}
  >
    {children}
  </JoyButton>;
});
