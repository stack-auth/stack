import { InputProps } from "@stackframe/stack-ui";
import { Input as JoyInput } from '@mui/joy';

export default function Input(props : InputProps) {
  const { color, size, ...validProps } = props;
  return <JoyInput {...validProps}/>;
}