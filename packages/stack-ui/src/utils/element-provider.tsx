import React, { createContext, useContext } from 'react';
import Button, { ButtonProps } from '../elements/button';
import Container, { ContainerProps } from '../elements/container';
import Divider, { DividerProps } from '../elements/divider';
import Input, { InputProps } from '../elements/input';
import Link, { LinkProps } from '../elements/link';
import Label, { LabelProps } from '../elements/label';
import Text, { TextProps } from '../elements/text';

type Elements = {
  Button: React.ElementType<ButtonProps>,
  Container: React.ElementType<ContainerProps>,
  Divider: React.ElementType<DividerProps>,
  Input: React.ElementType<InputProps>,
  Label: React.ElementType<LabelProps>,
  Link: React.ElementType<LinkProps>,
  Text: React.ElementType<TextProps>,
}

type ProviderProps = {
  children: React.ReactNode,
  elements?: Partial<Elements>,
}

const ElementContext = createContext<Elements | undefined>(undefined);

export function useElement() {
  const context = useContext(ElementContext);
  if (!context) {
    throw new Error('useElement must be used within a ElementProvider');
  }
  return context;
}

export function StackElementProvider(props: ProviderProps) {
  return (
    <ElementContext.Provider value={{
      Button: props.elements?.Button || Button,
      Container: props.elements?.Container || Container,
      Divider: props.elements?.Divider || Divider,
      Input: props.elements?.Input || Input,
      Label: props.elements?.Label || Label,
      Link: props.elements?.Link || Link,
      Text: props.elements?.Text || Text,
    }}>
      {props.children}
    </ElementContext.Provider>
  );
}