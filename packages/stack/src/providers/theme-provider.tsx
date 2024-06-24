'use client';

import React from "react";
import { StackDesignProvider, DesignConfig } from "./design-provider";
import StyledComponentsRegistry from "./styled-components-registry";
import { BrowserScript } from "../utils/browser-script";
import { globalCSS } from "../generated/global-css";

export type ThemeConfig = DesignConfig;

export function StackTheme({
  theme,
  children,
} : { 
  children?: React.ReactNode,
  theme?: DesignConfig,
}) {
  return (
    <StyledComponentsRegistry>
      <BrowserScript />
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      <StackDesignProvider {...theme}>
        {children}
      </StackDesignProvider>
    </StyledComponentsRegistry>
  );
}