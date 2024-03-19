'use client';
import { ComponentProps, createElement } from "react";
import { useComponents } from "..";
import { Components } from "../providers/element-provider";

export function createDynamicComponent<Component extends React.ElementType> (
  name: keyof Components
) {
  return function DynamicComponent (props: ComponentProps<Component>) {
    const component = useComponents()[name];
    return createElement(component as Component, props);
  };
}