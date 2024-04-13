'use client';

import React from 'react';
import { Input as DefaultInput } from "../components-core";
import { Input as JoyInput } from '@mui/joy';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof DefaultInput>
>(({
  color,
  size,
  ref: _,
  ...validProps
}, ref) => {
  return <JoyInput {...validProps}/>;
});