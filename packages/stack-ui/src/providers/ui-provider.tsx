'use client';

import React from "react";
import { StackDesignProvider, DesignConfig, hasCustomColorMode } from "./design-provider";
import { StackElementProvider, ElementConfig } from "./element-provider";
import StyledComponentsRegistry from "./styled-components-registry";

export type ThemeConfig = DesignConfig & ElementConfig;

export function StackUIProvider({
  theme,
  children,
} : { 
  children?: React.ReactNode,
  theme?: DesignConfig & ElementConfig,
}) {
  const elementProps = { elements: theme?.elements };
  let designProps: DesignConfig = {};
  if (theme && hasCustomColorMode(theme)) {
    let { colorMode, setColorMode } = theme;
    designProps = { colorMode, setColorMode };
  }
  designProps = designProps || {breakpoints: theme?.breakpoints, colors: theme?.colors};

  return (
    <StyledComponentsRegistry>
      <StackDesignProvider {...designProps}>
        <StackElementProvider {...elementProps}>
          {children}
        </StackElementProvider>
      </StackDesignProvider>
    </StyledComponentsRegistry>
  );
}