'use client';

import React from 'react';
import { forwardRef } from 'react';
import { Components, useComponents } from '../providers/component-provider';
import type { Button as StaticButton } from './button';
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

function createDynamicComponent<T extends keyof typeof Components>(
  component: T
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.ComponentProps<typeof Components[T]>> & 
  React.RefAttributes<React.ElementRef<typeof Components[T]>>
> {
  return forwardRef<
    React.ElementRef<typeof Components[T]>,
    React.ComponentProps<typeof Components[T]>
  >((props, ref) => {
    const Component = useComponents()[component] as any;
    return <Component {...props} ref={ref} />;
  });
};

export const Input = createDynamicComponent('Input');
export const Container = createDynamicComponent('Container');
export const Separator = createDynamicComponent('Separator');
export const Label = createDynamicComponent('Label');
export const Link = createDynamicComponent('Link');
export const Text = createDynamicComponent('Text');
export const Popover = createDynamicComponent('Popover');
export const PopoverTrigger = createDynamicComponent('PopoverTrigger');
export const PopoverContent = createDynamicComponent('PopoverContent');
export const DropdownMenu = createDynamicComponent('DropdownMenu');
export const DropdownMenuTrigger = createDynamicComponent('DropdownMenuTrigger');
export const DropdownMenuContent = createDynamicComponent('DropdownMenuContent');
export const DropdownMenuItem = createDynamicComponent('DropdownMenuItem');
export const DropdownMenuLabel = createDynamicComponent('DropdownMenuLabel');
export const DropdownMenuSeparator = createDynamicComponent('DropdownMenuSeparator');
export const Avatar = createDynamicComponent('Avatar');
export const AvatarFallback = createDynamicComponent('AvatarFallback');
export const AvatarImage = createDynamicComponent('AvatarImage');
export const Collapsible = createDynamicComponent('Collapsible');
export const CollapsibleTrigger = createDynamicComponent('CollapsibleTrigger');
export const CollapsibleContent = createDynamicComponent('CollapsibleContent');
export const Card = createDynamicComponent('Card');
export const CardHeader = createDynamicComponent('CardHeader');
export const CardContent = createDynamicComponent('CardContent');
export const CardFooter = createDynamicComponent('CardFooter');
export const Tabs = createDynamicComponent('Tabs');
export const TabsList = createDynamicComponent('TabsList');
export const TabsContent = createDynamicComponent('TabsContent');
export const TabsTrigger = createDynamicComponent('TabsTrigger');
export const Skeleton = createDynamicComponent('Skeleton');
