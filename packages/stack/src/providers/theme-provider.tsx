'use client';

import React, { ComponentProps } from "react";
import { StackDesignProvider, DesignConfig } from "./design-provider";
import { StackComponentProvider, ComponentConfig } from "./component-provider";
import StyledComponentsRegistry from "./styled-components-registry";
import { useTheme as useNextTheme, ThemeProvider as NextThemeProvider} from "next-themes";

export type ThemeConfig = DesignConfig & ComponentConfig;

export function StackTheme({
  theme,
  children,
  colorModeConfig,
} : { 
  children?: React.ReactNode,
  theme?: DesignConfig & ComponentConfig,
  colorModeConfig?: Omit<ComponentProps<typeof NextThemeProvider>, "themes" | "children">,
}) {
  const { theme: nextTheme } = useNextTheme();
  const componentProps = { components: theme?.components };

  const ColorModeProvider = !nextTheme ? NextThemeProvider : React.Fragment;
  const colorModeProps = !nextTheme ? colorModeConfig : {};

  return (
    <ColorModeProvider {...colorModeProps}>
      <StyledComponentsRegistry>
        <StackDesignProvider {...theme}>
          <StackComponentProvider {...componentProps}>
            {children}
          </StackComponentProvider>
        </StackDesignProvider>
      </StyledComponentsRegistry>
    </ColorModeProvider>
  );
}