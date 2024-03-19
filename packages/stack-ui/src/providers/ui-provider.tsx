'use client';

import React, { ComponentProps } from "react";
import { StackDesignProvider, DesignConfig, hasCustomColorMode } from "./design-provider";
import { StackElementProvider, ElementConfig } from "./element-provider";
import StyledComponentsRegistry from "./styled-components-registry";
import { useTheme as useNextTheme, ThemeProvider as NextThemeProvider} from "next-themes";

export type ThemeConfig = DesignConfig & ElementConfig;

export function StackUIProvider({
  theme,
  children,
  colorModeConfig,
} : { 
  children?: React.ReactNode,
  theme?: DesignConfig & ElementConfig,
  colorModeConfig?: Omit<ComponentProps<typeof NextThemeProvider>, "themes" | "children">,
}) {
  const { theme: nextTheme } = useNextTheme();
  const elementProps = { elements: theme?.elements };

  const ColorModeProvider = !nextTheme ? NextThemeProvider : React.Fragment;
  const colorModeProps = !nextTheme ? colorModeConfig : {};

  let designProps: DesignConfig = {};
  if (theme && hasCustomColorMode(theme)) {
    let { colorMode, setColorMode } = theme;
    designProps = { colorMode, setColorMode };
  }
  designProps = designProps || {breakpoints: theme?.breakpoints, colors: theme?.colors};

  return (
    <ColorModeProvider {...colorModeProps}>
      <StyledComponentsRegistry>
        <StackDesignProvider {...designProps}>
          <StackElementProvider {...elementProps}>
            {children}
          </StackElementProvider>
        </StackDesignProvider>
      </StyledComponentsRegistry>
    </ColorModeProvider>
  );
}