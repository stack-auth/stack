'use client';

import { CardProps } from "../components-core";
import { Card as JoyCard, CardContent as JoyCardContent } from '@mui/joy';

export function Card(props : CardProps) {
  const { color, size, ref, ...validProps } = props;
  return <JoyCard {...validProps}>
    <JoyCardContent>
      {props.children}
    </JoyCardContent>
  </JoyCard>;
}