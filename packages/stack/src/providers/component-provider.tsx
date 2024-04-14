'use client';

import React, { createContext, useContext } from 'react';
import { Button } from '../components-core/button';
import { Container } from '../components-core/container';
import { Separator } from '../components-core/separator';
import { Input } from '../components-core/input';
import { Link } from '../components-core/link';
import { Label } from '../components-core/label';
import { Text } from '../components-core/text';
import { Card, CardHeader, CardContent, CardFooter } from '../components-core/card';
import { Popover, PopoverTrigger, PopoverContent } from '../components-core/popover';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../components-core/dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '../components-core/avatar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../components-core/collapsible';

export const Components = {
  Input,
  Button,
  Container,
  Separator,
  Label,
  Link,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} as const;

export type ComponentConfig = {
  components?: Partial<typeof Components>,
}

const ComponentContext = createContext<typeof Components | undefined>(undefined);

export function useComponents() {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error('Stack UI components must be used within a StackTheme');
  }
  return context;
}

export function StackComponentProvider(props: { children?: React.ReactNode } & ComponentConfig) {
  return (
    <ComponentContext.Provider value={{ ...Components, ...props.components }}>
      {props.children}
    </ComponentContext.Provider>
  );
}
