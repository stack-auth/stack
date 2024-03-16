'use client';

import React from "react";
import { StackDesignProvider, DesignConfig } from "./design-provider";
import { StackElementProvider, ElementConfig } from "./element-provider";

export function StackUIProvider({
  theme,
  children,
} : { 
  children?: React.ReactNode, 
  theme?: DesignConfig & ElementConfig,
}) {
  return (
    <StackDesignProvider colors={theme?.colors} breakpoints={theme?.breakpoints}>
      <StackElementProvider elements={theme?.elements}>
        {children}
      </StackElementProvider>
    </StackDesignProvider>
  );
}