'use client';

import React from "react";
import { StackDesignProvider, DesignConfig } from "./design-provider";
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
  return (
    <StyledComponentsRegistry>
      <StackDesignProvider colors={theme?.colors} breakpoints={theme?.breakpoints}>
        <StackElementProvider elements={theme?.elements}>
          {children}
        </StackElementProvider>
      </StackDesignProvider>
    </StyledComponentsRegistry>
  );
}