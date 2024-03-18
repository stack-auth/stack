// import { InputProps } from "@stackframe/stack-ui";
// import { Input as JoyInput } from '@mui/joy';

// export default function Input(props : InputProps) {
//   const { color, size, ...validProps } = props;
//   return <JoyInput {...validProps}/>;
// }

import { TextProps } from "@stackframe/stack-ui";
import { Typography as JoyText } from '@mui/joy';

export default function Text(props : TextProps) {
  const { color, size, as, variant, ref, ...validProps } = props;
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
}