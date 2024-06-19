'use client';

import React from "react";
import { StackDesignProvider, DesignConfig } from "./design-provider";
import { StackComponentProvider, ComponentConfig } from "./component-provider";
import StyledComponentsRegistry from "./styled-components-registry";
import { BrowserScript } from "../utils/browser-script";
import { globalCSS } from "../generated/global-css";
import { html } from "@stackframe/stack-shared/dist/utils/html";

export type ThemeConfig = DesignConfig & ComponentConfig;

export function StackTheme({
  theme,
  children,
} : { 
  children?: React.ReactNode,
  theme?: DesignConfig & ComponentConfig,
}) {
  const componentProps = { components: theme?.components };

  return (
    <StyledComponentsRegistry>
      <style dangerouslySetInnerHTML={{ __html: html`${globalCSS}`}} />
      <BrowserScript />
      <StackDesignProvider {...theme}>
        <StackComponentProvider {...componentProps}>
          {children}
        </StackComponentProvider>
      </StackDesignProvider>
    </StyledComponentsRegistry>
  );
}