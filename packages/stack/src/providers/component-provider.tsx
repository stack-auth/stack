'use client';

import React, { createContext, useContext } from 'react';
import Button, { ButtonProps } from '../components-core/button';
import Container, { ContainerProps } from '../components-core/container';
import Divider, { DividerProps } from '../components-core/divider';
import Input, { InputProps } from '../components-core/input';
import Link, { LinkProps } from '../components-core/link';
import Label, { LabelProps } from '../components-core/label';
import Text, { TextProps } from '../components-core/text';
import { 
  Card, 
  CardProps, 
  CardHeader,
  CardHeaderProps, 
  CardContent,
  CardContentProps, 
  CardFooter,
  CardFooterProps, 
  CardDescription,
  CardDescriptionProps 
} from '../components-core/card';
import { Popover, PopoverTrigger, PopoverContent, PopoverProps, PopoverContentProps, PopoverTriggerProps } from '../components-core/popover';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuSeparatorProps,
} from '../components-core/dropdown';
import { Avatar, AvatarProps, AvatarFallback, AvatarFallbackProps, AvatarImage, AvatarImageProps } from '../components-core/avatar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps } from '../components-core/collapsible';

export type Components = {
  Button: React.ComponentType<ButtonProps>,
  Container: React.ComponentType<ContainerProps>,
  Divider: React.ComponentType<DividerProps>,
  Input: React.ComponentType<InputProps>,
  Label: React.ComponentType<LabelProps>,
  Link: React.ComponentType<LinkProps>,
  Text: React.ComponentType<TextProps>,
  Card: React.ComponentType<CardProps>,
  Popover: React.ComponentType<PopoverProps>,
  PopoverTrigger: React.ComponentType<PopoverTriggerProps>,
  PopoverContent: React.ComponentType<PopoverContentProps>,
  DropdownMenu: React.ComponentType<DropdownMenuProps>,
  DropdownMenuTrigger: React.ComponentType<DropdownMenuTriggerProps>,
  DropdownMenuContent: React.ComponentType<DropdownMenuContentProps>,
  DropdownMenuItem: React.ComponentType<DropdownMenuItemProps>,
  DropdownMenuLabel: React.ComponentType<DropdownMenuLabelProps>,
  DropdownMenuSeparator: React.ComponentType<DropdownMenuSeparatorProps>,
  Avatar: React.ComponentType<AvatarProps>,
  AvatarFallback: React.ComponentType<AvatarFallbackProps>,
  AvatarImage: React.ComponentType<AvatarImageProps>,
  Collapsible: React.ComponentType<CollapsibleProps>,
  CollapsibleTrigger: React.ComponentType<CollapsibleTriggerProps>,
  CollapsibleContent: React.ComponentType<CollapsibleContentProps>,
  CardHeader: React.ComponentType<CardHeaderProps>,
  CardContent: React.ComponentType<CardContentProps>,
  CardFooter: React.ComponentType<CardFooterProps>,
  CardDescription: React.ComponentType<CardDescriptionProps>,
}

export type ComponentConfig = {
  components?: Partial<Components>,
}

const ComponentContext = createContext<Components | undefined>(undefined);

export function useComponents() {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error('Stack UI components must be used within a StackTheme');
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
      Card: props.components?.Card || Card,
      Popover: props.components?.Popover || Popover,
      PopoverTrigger: props.components?.PopoverTrigger || PopoverTrigger,
      PopoverContent: props.components?.PopoverContent || PopoverContent,
      DropdownMenu: props.components?.DropdownMenu || DropdownMenu,
      DropdownMenuTrigger: props.components?.DropdownMenuTrigger || DropdownMenuTrigger,
      DropdownMenuContent: props.components?.DropdownMenuContent || DropdownMenuContent,
      DropdownMenuItem: props.components?.DropdownMenuItem || DropdownMenuItem,
      DropdownMenuLabel: props.components?.DropdownMenuLabel || DropdownMenuLabel,
      DropdownMenuSeparator: props.components?.DropdownMenuSeparator || DropdownMenuSeparator,
      Avatar: props.components?.Avatar || Avatar,
      AvatarFallback: props.components?.AvatarFallback || AvatarFallback,
      AvatarImage: props.components?.AvatarImage || AvatarImage,
      Collapsible: props.components?.Collapsible || Collapsible,
      CollapsibleTrigger: props.components?.CollapsibleTrigger || CollapsibleTrigger,
      CollapsibleContent: props.components?.CollapsibleContent || CollapsibleContent,
      CardHeader: props.components?.CardHeader || CardHeader,
      CardContent: props.components?.CardContent || CardContent,
      CardFooter: props.components?.CardFooter || CardFooter,
      CardDescription: props.components?.CardDescription || CardDescription,
    }}>
      {props.children}
    </ComponentContext.Provider>
  );
}