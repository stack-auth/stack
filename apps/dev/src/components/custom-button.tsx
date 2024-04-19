'use client';

import React from "react";
import { Button as DefaultButton, useDesign } from "@stackframe/stack";

export const Button = React.forwardRef<
  React.ElementRef<typeof DefaultButton>,
  React.ComponentProps<typeof DefaultButton>
>(({
  variant = "primary",
  color,
  size = "md",
  loading = false,
  disabled = false,
  ...props
}, ref) => {
  const { colors } = useDesign();

  return <button
    style={{
      padding: ({ sm: 5, md: 10, lg: 15 } as const)[size],
      backgroundColor: color || ({
        primary: colors.primaryColor,
        secondary: colors.secondaryColor,
      } as const)[variant],
    }}
    disabled={loading || disabled}
    {...props}
  />;
});

Button.displayName = "Button";