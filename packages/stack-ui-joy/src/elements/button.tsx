import { ButtonProps } from "@stackframe/stack-ui";
import { Button as JoyButton } from '@mui/joy';
import Color from "color";

export default function Button({
  color = "primary",
  size = "md",
  loading = false,
  ...props
} : ButtonProps) {
  const muiColor: "primary" | "neutral" | "danger" = ({
    primary: "primary",
    secondary: "neutral",
    warning: "danger",
  } as const)[color] || "primary";
  const customColor = ['primary', 'secondary', 'warning', 'transparent'].includes(color) ? undefined : color;
  const variant = color === "transparent" ? "plain" : "solid";

  const { children, action, ref, ...validProps } = props;

  return <JoyButton 
    color={muiColor}
    variant={variant}
    sx={customColor ? {
      backgroundColor: customColor,
      color: Color(customColor).isDark() ? 'white' : 'black',
      '&:hover': {
        backgroundColor: Color(customColor).darken(0.1).toString(),
      },
      '&:active': {
        backgroundColor: Color(customColor).darken(0.2).toString(),
      },
    } : {}}
    size={size}
    loading={loading}
    {...validProps}
  >
    {children}
  </JoyButton>;
}