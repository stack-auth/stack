'use client';

import * as React from 'react';
import styled from 'styled-components';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useDesign } from '..';
import { SELECTED_BACKGROUND_COLORS } from '../utils/constants';
import { ColorPalette } from '../providers/design-provider';

const DropdownMenu = DropdownMenuPrimitive.Root;

const StyledTrigger = styled(DropdownMenuPrimitive.Trigger)`
  all: unset;
  &:focus {
    outline: none;
    box-shadow: 0;
  }
`;

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <StyledTrigger ref={ref} {...props} />
));

const StyledContent = styled(DropdownMenuPrimitive.Content)<{
  $colors: ColorPalette,
}>`
  z-index: 50;
  min-width: 8rem;
  overflow: hidden;
  border-radius: 4px;
  padding: 0.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  border: 1px solid ${({ $colors }) => $colors.light.neutralColor};
  background: ${({ $colors }) => $colors.light.backgroundColor};

  html[data-theme='dark'] & {
    border-color: ${({ $colors }) => $colors.dark.neutralColor};
    background: ${({ $colors }) => $colors.dark.backgroundColor};
  }
`;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const { colors } = useDesign();
  return (
    <DropdownMenuPrimitive.Portal>
      <StyledContent 
        $colors={colors}
        sideOffset={sideOffset} 
        ref={ref} 
        {...props}  
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

const StyledItem = styled(DropdownMenuPrimitive.Item)<{ 
  $inset?: boolean,
}>`
  display: flex;
  cursor: default;
  align-items: center;
  border-radius: 4px;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: color 0.2s ease;
  &:focus {
    background-color: var(--accent);
    color: var(--accent-foreground);
  }
  ${({ $inset }) => $inset && 'padding-left: 2rem;'}

  &:hover {
    background-color: ${SELECTED_BACKGROUND_COLORS.light};
  }

  html[data-theme='dark'] & {
    &:hover {
      background-color: ${SELECTED_BACKGROUND_COLORS.dark};
    }
  }
`;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean,
  }
>(({ className, inset, ...props }, ref) => {
  return <StyledItem ref={ref} {...props} $inset={inset} />;
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

const StyledLabel = styled(DropdownMenuPrimitive.Label)<{ inset?: boolean }>`
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  font-weight: bold;
  ${({ inset }) => inset && 'padding-left: 2rem;'}
`;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean,
  }
>(({ className, inset, ...props }, ref) => (
  <StyledLabel ref={ref} {...props} inset={inset} />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const StyledSeparator = styled(DropdownMenuPrimitive.Separator)<{
  $colors: ColorPalette,
}>`
  margin: 0.25rem -0.25rem;
  height: 1px;
  background-color: ${({ $colors }) => $colors.light.neutralColor};

  html[data-theme='dark'] & {
    background-color: ${({ $colors }) => $colors.dark.neutralColor};
  }
`;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const { colors } = useDesign();
  return <StyledSeparator ref={ref} {...props} $colors={colors} />;
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
