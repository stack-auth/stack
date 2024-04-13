'use client';

import React from "react";
import { Divider as DefaultDevider } from "../components-core";
import { Divider as JoyDivider } from '@mui/joy';

export const Divider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DefaultDevider>
>(({
  orientation,
  ref: _,
  ...validProps
}, ref) => {
  return <JoyDivider {...validProps} orientation={orientation} />;
});