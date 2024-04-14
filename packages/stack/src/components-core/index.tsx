'use client';

import React from 'react';
import { forwardRef } from 'react';
import { Components, useComponents } from '../providers/component-provider';
import type { Button as StaticButton } from './button';
import type { Container as StaticContainer } from './container';
import type { Separator as StaticSeparator } from './separator';
import type { Input as StaticInput } from './input';
import type { Label as StaticLabel } from './label';
import type { Link as StaticLink } from './link';
import type { Text as StaticText } from './text';
import type { 
  Card as StaticCard,
  CardHeader as StaticCardHeader,
  CardContent as StaticCardContent,
  CardFooter as StaticCardFooter,
  CardDescription as StaticCardDescription,
} from './card';
import type { 
  Popover as StaticPopover,
  PopoverContent as StaticPopoverContent,
  PopoverTrigger as StaticPopoverTrigger,
} from './popover';
import type { 
  DropdownMenu as StaticDropdownMenu,
  DropdownMenuTrigger as StaticDropdownMenuTrigger,
  DropdownMenuContent as StaticDropdownMenuContent,
  DropdownMenuItem as StaticDropdownMenuItem,
  DropdownMenuLabel as StaticDropdownMenuLabel,
  DropdownMenuSeparator as StaticDropdownMenuSeparator,
} from './dropdown';
import type { 
  Avatar as StaticAvatar,
  AvatarFallback as StaticAvatarFallback,
  AvatarImage as StaticAvatarImage,
} from './avatar';
import type { 
  Collapsible as StaticCollapsible,
  CollapsibleTrigger as StaticCollapsibleTrigger,
  CollapsibleContent as StaticCollapsibleContent,
} from './collapsible';
import { useAsyncCallbackWithLoggedError } from '@stackframe/stack-shared/dist/hooks/use-async-callback';

export const Button = forwardRef<
  HTMLButtonElement, 
  React.ComponentProps<typeof StaticButton>
>((props, ref) => {
  const { Button } = useComponents();
  const [onClick, onClickLoading] = useAsyncCallbackWithLoggedError(async () => {
    return await props.onClick?.();
  }, [props.onClick]);

  return <Button
    {...props}
    onClick={props.onClick && onClick}
    loading={props.loading || onClickLoading}
    disabled={props.disabled || onClickLoading}
    ref={ref}
  />;
});

export const Container = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticContainer>
>((props, ref) => {
  const { Container } = useComponents();
  return <Container {...props} ref={ref} />;
});

export const Separator = forwardRef<
  HTMLHRElement, 
  React.ComponentProps<typeof StaticSeparator>
>((props, ref) => {
  const { Separator } = useComponents();
  return <Separator {...props} ref={ref} />;
});

export const Input = forwardRef<
  HTMLInputElement, 
  React.ComponentProps<typeof StaticInput>
>((props, ref) => {
  const { Input } = useComponents();
  return <Input {...props} ref={ref} />;
});

export const Label = forwardRef<
  HTMLLabelElement, 
  React.ComponentProps<typeof StaticLabel>
>((props, ref) => {
  const { Label } = useComponents();
  return <Label {...props} ref={ref} />;
});

export function Link(props: React.ComponentProps<typeof StaticLink>) {
  const { Link } = useComponents();
  return <Link {...props} />;
}

export const Text = forwardRef<
  HTMLParagraphElement, 
  React.ComponentProps<typeof StaticText>
>((props, ref) => {
  const { Text } = useComponents();
  return <Text {...props} ref={ref} />;
});

export const Card = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticCard>
>((props, ref) => {
  const { Card } = useComponents();
  return <Card {...props} ref={ref} />;
});

export function Popover(props: React.ComponentProps<typeof StaticPopover>) {
  const { Popover } = useComponents();
  return <Popover {...props} />;
}

export const PopoverTrigger = forwardRef<
  HTMLButtonElement, 
  React.ComponentProps<typeof StaticPopoverTrigger>
>((props, ref) => {
  const { PopoverTrigger } = useComponents();
  return <PopoverTrigger {...props} ref={ref} />;
});

export const PopoverContent = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticPopoverContent>
>((props, ref) => {
  const { PopoverContent } = useComponents();
  return <PopoverContent {...props} ref={ref} />;
});

export function DropdownMenu(props: React.ComponentProps<typeof StaticDropdownMenu>) {
  const { DropdownMenu } = useComponents();
  return <DropdownMenu {...props} />;
}

export const DropdownMenuTrigger = forwardRef<
  HTMLButtonElement, 
  React.ComponentProps<typeof StaticDropdownMenuTrigger>
>((props, ref) => {
  const { DropdownMenuTrigger } = useComponents();
  return <DropdownMenuTrigger {...props} ref={ref} />;
});

export const DropdownMenuContent = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticDropdownMenuContent>
>((props, ref) => {
  const { DropdownMenuContent } = useComponents();
  return <DropdownMenuContent {...props} ref={ref} />;
});

export const DropdownMenuItem = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticDropdownMenuItem>
>((props, ref) => {
  const { DropdownMenuItem } = useComponents();
  return <DropdownMenuItem {...props} ref={ref} />;
});

export const DropdownMenuLabel = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticDropdownMenuLabel>
>((props, ref) => {
  const { DropdownMenuLabel } = useComponents();
  return <DropdownMenuLabel {...props} ref={ref} />;
});

export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticDropdownMenuSeparator>
>((props, ref) => {
  const { DropdownMenuSeparator } = useComponents();
  return <DropdownMenuSeparator {...props} ref={ref} />;
});

export const Avatar = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticAvatar>
>((props, ref) => {
  const { Avatar } = useComponents();
  return <Avatar {...props} ref={ref} />;
});

export const AvatarFallback = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticAvatarFallback>
>((props, ref) => {
  const { AvatarFallback } = useComponents();
  return <AvatarFallback {...props} ref={ref} />;
});

export const AvatarImage = forwardRef<
  HTMLImageElement, 
  React.ComponentProps<typeof StaticAvatarImage>
>((props, ref) => {
  const { AvatarImage } = useComponents();
  return <AvatarImage {...props} ref={ref} />;
});

export function Collapsible(props: React.ComponentProps<typeof StaticCollapsible>) {
  const { Collapsible } = useComponents();
  return <Collapsible {...props} />;
}

export const CollapsibleTrigger = forwardRef<
  HTMLButtonElement, 
  React.ComponentProps<typeof StaticCollapsibleTrigger>
>((props, ref) => {
  const { CollapsibleTrigger } = useComponents();
  return <CollapsibleTrigger {...props} ref={ref} />;
});

export const CollapsibleContent = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticCollapsibleContent>
>((props, ref) => {
  const { CollapsibleContent } = useComponents();
  return <CollapsibleContent {...props} ref={ref} />;
});

export const CardHeader = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticCardHeader>
>((props, ref) => {
  const { CardHeader } = useComponents();
  return <CardHeader {...props} ref={ref} />;
});

export const CardContent = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticCardContent>
>((props, ref) => {
  const { CardContent } = useComponents();
  return <CardContent {...props} ref={ref} />;
});

export const CardFooter = forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof StaticCardFooter>
>((props, ref) => {
  const { CardFooter } = useComponents();
  return <CardFooter {...props} ref={ref} />;
});

export const CardDescription = forwardRef<
  HTMLParagraphElement, 
  React.ComponentProps<typeof StaticCardDescription>
>((props, ref) => {
  const { CardDescription } = useComponents();
  return <CardDescription {...props} ref={ref} />;
});
