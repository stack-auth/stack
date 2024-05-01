'use client';

import { StackTheme, ThemeConfig } from "./theme-provider";
import { useColorScheme } from "@mui/joy";
import { Button } from '../components-core-joy/button';
import { Input } from '../components-core-joy/input';
import { Text } from '../components-core-joy/text';
import { Separator } from '../components-core-joy/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components-core-joy/tabs';

export const defaultComponents = {
  Button,
  Input,
  Text,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
};

export function StackJoyTheme(props : { theme?: ThemeConfig, children?: React.ReactNode }) {
  const mergedTheme = {
    components: {
      ...defaultComponents,
      ...props.theme?.components,
    },
    ...props.theme,
  };

  return (
    <StackTheme theme={mergedTheme}>
      {props.children}
    </StackTheme>
  );
}