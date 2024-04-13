'use client';

import React from "react";
import { Separator as DefaultDevider } from "../components-core";
import { Divider as JoySeparator } from '@mui/joy';

export const Separator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DefaultDevider>
>(({
  orientation,
  ref: _,
  ...validProps
}, ref) => {
  return <JoySeparator {...validProps} orientation={orientation} />;
});