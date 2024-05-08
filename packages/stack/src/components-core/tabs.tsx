import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import styled from 'styled-components';
import { useDesign } from '..';
import { ColorPalette } from '../providers/design-provider';

const Tabs = TabsPrimitive.Root;

const StyledTabsList = styled(TabsPrimitive.List)`
  display: flex;
  height: 2.5rem
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  padding: 0.25rem;

  background-color: rgb(244, 244, 245);

  html[data-theme='dark'] & {
    background-color: rgb(39, 39, 42);
  }
`;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentProps<typeof TabsPrimitive.List>
>((props, ref) => {
  return <StyledTabsList
    {...props} 
    ref={ref} 
  />;
});

const StyledTabsTrigger = styled(TabsPrimitive.Trigger)<{
  $colors: ColorPalette,
}>`
  all: unset;
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  transition: all;
  outline: none;

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  &[data-state='active'] {
    background-color: ${({ $colors }) => $colors.light.backgroundColor};
  }

  html[data-theme='dark'] & {
    &[data-state='active'] {
      background-color: ${({ $colors }) => $colors.dark.backgroundColor};
    }
  }
`;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentProps<typeof TabsPrimitive.Trigger>
>((props, ref) => {
  const { colors } = useDesign();
  return <StyledTabsTrigger 
    $colors={colors}
    {...props} 
    ref={ref} 
  />;
});

const StyledTabsContent = styled(TabsPrimitive.Content)`
  margin-top: 1.5rem;
`;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentProps<typeof TabsPrimitive.Content>
>((props, ref) => {
  return <StyledTabsContent {...props} ref={ref} />;
});

export { Tabs, TabsList, TabsTrigger, TabsContent };
