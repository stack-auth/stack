import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import styled from 'styled-components';
import { useDesign } from '..';

const Tabs = TabsPrimitive.Root;

const StyledTabsList = styled(TabsPrimitive.List)<{
  $bgColor: string,
}>`
  display: flex;
  height: 40px;
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
  const { colors } = useDesign();
  return <StyledTabsList $bgColor={colors.neutralColor} {...props} ref={ref} />;
});

const TabsTrigger = styled(TabsPrimitive.Trigger)`
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
    background-color: white;
  }
`;

const TabsContent = styled(TabsPrimitive.Content)`
  margin-top: 8px;
  ring-offset-color: var(--color-background);
  &:focus-visible {
    outline: none;
    ring: 2px solid var(--color-ring);
    ring-offset: 2px;
  }
`;

export { Tabs, TabsList, TabsTrigger, TabsContent };
