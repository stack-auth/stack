'use client';

import { StackTheme, ThemeConfig } from "./theme-provider";
import { useColorScheme } from "@mui/joy";
import Button from '../components-core-joy/button';
import Input from '../components-core-joy/input';
import Text from '../components-core-joy/text';
import Divider from '../components-core-joy/divider';

export const defaultComponents = {
  Button,
  Input,
  Text,
  Divider
};

export function StackJoyTheme(props : { theme?: ThemeConfig, children?: React.ReactNode }) {
  const { mode, systemMode, setMode } = useColorScheme();
  const mergedTheme = {
    components: {
      ...defaultComponents,
      ...props.theme?.components,
    },
    colorMode: mode === 'system' ? systemMode : mode,
    setColorMode: setMode,
    ...props.theme,
  };

  return (
    <StackTheme theme={mergedTheme}>
      {props.children}
    </StackTheme>
  );
}