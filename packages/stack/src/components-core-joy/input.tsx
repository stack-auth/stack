'use client';

import React from 'react';
import { Input as DefaultInput } from "../components-core";
import { Input as JoyInput } from '@mui/joy';

export const Input = React.forwardRef<
  React.ElementRef<typeof DefaultInput>,
  React.ComponentProps<typeof DefaultInput>
>(({
  color,
  size,
  ref: _,
  ...validProps
}, ref) => {
  return <JoyInput {...validProps}/>;
});