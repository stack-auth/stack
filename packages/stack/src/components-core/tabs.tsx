import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import styled from 'styled-components';
import { useDesign } from '..';

const Tabs = TabsPrimitive.Root;

const StyledTabsList = styled(TabsPrimitive.List)<{
  $bgColor: string,
}>`
  display: flex;
  height: 2.5rem
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background-color: ${props => props.$bgColor};
  padding: 0.25rem;
`;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentProps<typeof TabsPrimitive.List>
>((props, ref) => {
  const { colorMode } = useDesign();
  return <StyledTabsList 
    $bgColor={colorMode === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(244, 244, 245)'}
    {...props} 
    ref={ref} 
  />;
});

const StayledTabsTrigger = styled(TabsPrimitive.Trigger)<{
  $bgColor: string,
}>`
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
    background-color: ${props => props.$bgColor};
  }
`;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentProps<typeof TabsPrimitive.Trigger>
>((props, ref) => {
  const { colors } = useDesign();
  return <StayledTabsTrigger 
    $bgColor={colors.backgroundColor}
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
