'use client';

import { forwardRef } from 'react';
import { useComponents } from '../providers/component-provider';
import { ButtonProps } from './button';
import { ContainerProps } from './container';
import { DividerProps } from './divider';
import { InputProps } from './input';
import { LabelProps } from './label';
import { LinkProps } from './link';
import { TextProps } from './text';
import { CardProps } from './card';

export {
  ButtonProps,
  ContainerProps,
  DividerProps,
  InputProps,
  LabelProps,
  LinkProps,
  TextProps,
  CardProps,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { Button } = useComponents();
  return <Button {...props} ref={ref} />;
});

export const Container = forwardRef<HTMLDivElement, ContainerProps>((props, ref) => {
  const { Container } = useComponents();
  return <Container {...props} ref={ref} />;
});

export const Divider = forwardRef<HTMLHRElement, DividerProps>((props, ref) => {
  const { Divider } = useComponents();
  return <Divider {...props} ref={ref} />;
});

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { Input } = useComponents();
  return <Input {...props} ref={ref} />;
});

export const Label = forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  const { Label } = useComponents();
  return <Label {...props} ref={ref} />;
});

export function Link(props: LinkProps) { // TODO: maybe add forwardRef
  const { Link } = useComponents();
  return <Link {...props} />;
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>((props, ref) => {
  const { Text } = useComponents();
  return <Text {...props} ref={ref} />;
});

export const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { Card } = useComponents();
  return <Card {...props} ref={ref} />;
});
