'use client';

import { InputProps } from "../components-core";
import { Input as JoyInput } from '@mui/joy';

export default function Input(props : InputProps) {
  const { color, size, ref, ...validProps } = props;
  return <JoyInput {...validProps}/>;
}