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
  const customColor = ['primary', 'secondary', 'warning'].includes(color) ? undefined : color;

  const { children, action, ref, ...validProps } = props;
  const c = Color(customColor);
  const changeColor = (value: number) => {
    return c.hsl(c.hue(), c.saturationl(), c.lightness() + value).toString();
  };

  return <JoyButton 
    variant="solid"
    color={muiColor}
    sx={customColor ? {
      backgroundColor: customColor,
      color: c.isDark() ? 'white' : 'black',
      '&:hover': {
        backgroundColor: c.isDark() ? changeColor(10) : changeColor(-10),
      },
      '&:active': {
        backgroundColor: c.isDark() ? changeColor(20) : changeColor(-20),
      },
    } : {}}
    size={size}
    loading={loading}
    {...validProps}
  >
    {children}
  </JoyButton>;
}