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
import { PopoverProps, PopoverContentProps, PopoverTriggerProps } from './popover';
import { 
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuSeparatorProps,
} from './dropdown';
import { AvatarProps, AvatarFallbackProps, AvatarImageProps } from './avatar';

export {
  ButtonProps,
  ContainerProps,
  DividerProps,
  InputProps,
  LabelProps,
  LinkProps,
  TextProps,
  CardProps,
  PopoverProps,
  PopoverContentProps,
  PopoverTriggerProps,
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuSeparatorProps,
  AvatarProps,
  AvatarFallbackProps,
  AvatarImageProps,
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

export function Popover(props: PopoverProps) {
  const { Popover } = useComponents();
  return <Popover {...props} />;
}

export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>((props, ref) => {
  const { PopoverTrigger } = useComponents();
  return <PopoverTrigger {...props} ref={ref} />;
});

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>((props, ref) => {
  const { PopoverContent } = useComponents();
  return <PopoverContent {...props} ref={ref} />;
});

export function DropdownMenu(props: DropdownMenuProps) {
  const { DropdownMenu } = useComponents();
  return <DropdownMenu {...props} />;
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>((props, ref) => {
  const { DropdownMenuTrigger } = useComponents();
  return <DropdownMenuTrigger {...props} ref={ref} />;
});

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>((props, ref) => {
  const { DropdownMenuContent } = useComponents();
  return <DropdownMenuContent {...props} ref={ref} />;
});

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>((props, ref) => {
  const { DropdownMenuItem } = useComponents();
  return <DropdownMenuItem {...props} ref={ref} />;
});

export const DropdownMenuLabel = forwardRef<HTMLDivElement, DropdownMenuLabelProps>((props, ref) => {
  const { DropdownMenuLabel } = useComponents();
  return <DropdownMenuLabel {...props} ref={ref} />;
});

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>((props, ref) => {
  const { DropdownMenuSeparator } = useComponents();
  return <DropdownMenuSeparator {...props} ref={ref} />;
});

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>((props, ref) => {
  const { Avatar } = useComponents();
  return <Avatar {...props} ref={ref} />;
});

export const AvatarFallback = forwardRef<HTMLDivElement, AvatarFallbackProps>((props, ref) => {
  const { AvatarFallback } = useComponents();
  return <AvatarFallback {...props} ref={ref} />;
});

export const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>((props, ref) => {
  const { AvatarImage } = useComponents();
  return <AvatarImage {...props} ref={ref} />;
});
