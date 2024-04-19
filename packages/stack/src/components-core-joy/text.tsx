'use client';

import React from 'react';
import { Text as DefaultText } from "../components-core";
import { Typography as JoyText } from '@mui/joy';

export const Text = React.forwardRef<
  React.ElementRef<typeof DefaultText>,
  React.ComponentProps<typeof DefaultText>
>((props, ref) => {
  const { color, size, as, variant, ref: _, ...validProps } = props;
  const muiLevel = ({
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h4',
    h6: 'h4',
    p: ({
      xl: 'body-lg',
      lg: 'body-lg',
      md: 'body-md',
      sm: 'body-sm',
      xs: 'body-xs'
    } as const)[size || 'md']
  } as const)[as || 'p'];
  const muiColor = ({
    primary: undefined,
    secondary: 'neutral',
    success: 'success',
    warning: 'danger',
  } as const)[variant || 'primary'];

  return <JoyText level={muiLevel} color={muiColor} {...validProps}/>;
});