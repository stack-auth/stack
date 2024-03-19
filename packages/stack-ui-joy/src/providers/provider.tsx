import { StackUIProvider, ThemeConfig } from "@stackframe/stack-ui";
import { useColorScheme } from "@mui/joy";
import Button from '../components/button';
import Input from '../components/input';
import Text from '../components/text';
import Divider from '../components/divider';

export const defaultComponents = {
  Button,
  Input,
  Text,
  Divider
};

export default function StackUIJoyProvider(props : { theme?: ThemeConfig, children?: React.ReactNode }) {
  const { mode, setMode } = useColorScheme();
  const mergedTheme = {
    components: {
      ...defaultComponents,
      ...props.theme?.components,
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