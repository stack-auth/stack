'use client';

import React from "react";
import { StackDesignProvider, DesignProviderProps } from "./design-provider";
import { StackElementProvider, ElementProviderProps } from "./element-provider";

export function StackUIProvider(props : { 
  children?: React.ReactNode, 
} & DesignProviderProps & ElementProviderProps) {
  const designProps = {
    breakpoints: props.breakpoints,
    colors: props.colors,
  };
  const elementProps = {
    elements: props.elements,
  };
  return (
    <StackDesignProvider {...designProps}>
      <StackElementProvider {...elementProps}>
        {props.children}
      </StackElementProvider>
    </StackDesignProvider>
  );
}