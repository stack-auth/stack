'use client';

import React, { createContext, useContext } from 'react';
import Button, { ButtonProps } from '../components-core/button';
import Container, { ContainerProps } from '../components-core/container';
import Divider, { DividerProps } from '../components-core/divider';
import Input, { InputProps } from '../components-core/input';
import Link, { LinkProps } from '../components-core/link';
import Label, { LabelProps } from '../components-core/label';
import Text, { TextProps } from '../components-core/text';

export type Components = {
  Button: React.ComponentType<ButtonProps>,
  Container: React.ComponentType<ContainerProps>,
  Divider: React.ComponentType<DividerProps>,
  Input: React.ComponentType<InputProps>,
  Label: React.ComponentType<LabelProps>,
  Link: React.ComponentType<LinkProps>,
  Text: React.ComponentType<TextProps>,
}

export type ComponentConfig = {
  components?: Partial<Components>,
}

const ComponentContext = createContext<Components | undefined>(undefined);

export function useComponents() {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error('Stack UI components must be used within a StackUIProvider');
  }
  return context;
}

export function StackComponentProvider(props: { children?: React.ReactNode } & ComponentConfig) {
  return (
    <ComponentContext.Provider value={{
      Button: props.components?.Button || Button,
      Container: props.components?.Container || Container,
      Divider: props.components?.Divider || Divider,
      Input: props.components?.Input || Input,
      Label: props.components?.Label || Label,
      Link: props.components?.Link || Link,
      Text: props.components?.Text || Text,
    }}>
      {props.children}
    </ComponentContext.Provider>
  );
}