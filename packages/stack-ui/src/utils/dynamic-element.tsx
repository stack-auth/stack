'use client';
import { ComponentProps, createElement } from "react";
import { useElements } from "..";
import { Elements } from "../providers/element-provider";

export function createDynamicElement<Element extends React.ElementType> (
  name: keyof Elements
) {
  return function DynamicElement (props: ComponentProps<Element>) {
    const element = useElements()[name];
    return createElement(element as Element, props);
  };
}