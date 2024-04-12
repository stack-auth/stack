'use client';

import { ButtonProps } from "../components-core";
import { Button as JoyButton } from '@mui/joy';
import Color from "color";

export default function Button({
  variant = "primary",
  color,
  size = "md",
  loading = false,
  ...props
} : ButtonProps) {
  const muiVariant: "primary" | "neutral" | "danger" = ({
    primary: "primary",
    secondary: "neutral",
    warning: "danger",
    transparent: "primary",
  } as const)[variant] || "primary";

  const { children, action, ref, ...validProps } = props;
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
    variant={variant === 'transparent' ? 'plain' : 'solid'}
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
}