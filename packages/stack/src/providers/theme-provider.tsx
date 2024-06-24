'use client';
import React from "react";
import { StackDesignProvider, DesignConfig } from "./design-provider";
import StyledComponentsRegistry from "./styled-components-registry";
import { globalCSS } from "../generated/global-css";

export function StackTheme({
  theme,
  children,
} : { 
  children?: React.ReactNode,
  theme?: DesignConfig,
}) {
  return (
    <StyledComponentsRegistry>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      <StackDesignProvider {...theme}>
        {children}
      </StackDesignProvider>
    </StyledComponentsRegistry>
  );
}