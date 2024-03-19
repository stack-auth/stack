'use client';

import { DividerProps } from "@stackframe/stack-ui";
import { Divider as JoyDivider } from '@mui/joy';

export default function Divider(props : DividerProps) {
  const { direction, ...validProps } = props;
  return <JoyDivider {...validProps} orientation={direction} />;
}