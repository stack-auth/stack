'use client';

import React, { ComponentProps, createElement } from "react";
import { useComponents } from "..";
import { Components } from "../providers/component-provider";

export function createDynamicComponent<Component extends React.ElementType> (
  name: keyof Components
) {
  return function DynamicComponent (props: ComponentProps<Component>) {
    const component = useComponents()[name];
    return createElement(component as Component, props);
  };
}