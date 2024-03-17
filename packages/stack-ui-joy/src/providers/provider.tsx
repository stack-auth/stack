import { StackUIProvider, ThemeConfig } from "@stackframe/stack-ui";
import Button from '../elements/button';
import Input from '../elements/input';
import { useColorScheme } from "@mui/joy";

export const defaultElements = {
  Button,
  Input,
};

export default function StackUIJoyProvider(props : { theme?: ThemeConfig, children?: React.ReactNode }) {
  const { mode, setMode } = useColorScheme();
  const mergedTheme = {
    elements: {
      ...defaultElements,
      ...props.theme?.elements,
    },
    colorMode: mode,
    setColorMode: setMode,
    ...props.theme,
  };

  return (
    <StackUIProvider theme={mergedTheme}>
      {props.children}
    </StackUIProvider>
  );
}