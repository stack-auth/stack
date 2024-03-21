'use client';

import React, { ComponentProps } from "react";
import { StackDesignProvider, DesignConfig, hasCustomColorMode } from "./design-provider";
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

  let designProps: DesignConfig = {};
  if (theme && hasCustomColorMode(theme)) {
    let { colorMode, setColorMode } = theme;
    designProps = { colorMode, setColorMode };
  }
  designProps = { breakpoints: theme?.breakpoints, colors: theme?.colors, ...designProps };

  return (
    <ColorModeProvider {...colorModeProps}>
      <StyledComponentsRegistry>
        <StackDesignProvider {...designProps}>
          <StackComponentProvider {...componentProps}>
            {children}
          </StackComponentProvider>
        </StackDesignProvider>
      </StyledComponentsRegistry>
    </ColorModeProvider>
  );
}