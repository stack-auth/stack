'use client';

import * as React from 'react';
import styled from 'styled-components';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useDesign } from '..';
import { SELECTED_BACKGROUND_COLORS } from '../utils/constants';

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
  $backgroundColor: string,
  $neutralColor: string,
}>`
  z-index: 50;
  min-width: 8rem;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid ${({ $neutralColor }) => $neutralColor};
  background: ${({ $backgroundColor }) => $backgroundColor};
  padding: 0.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const { colors } = useDesign();
  return (
    <DropdownMenuPrimitive.Portal>
      <StyledContent 
        $backgroundColor={colors.backgroundColor}
        $neutralColor={colors.neutralColor}
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
  $colorMode: 'dark' | 'light',
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
  &:hover {
    background-color: ${({ $colorMode }) => SELECTED_BACKGROUND_COLORS[$colorMode]};
  }
  ${({ $inset }) => $inset && 'padding-left: 2rem;'}
`;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean,
  }
>(({ className, inset, ...props }, ref) => {
  const { colorMode } = useDesign();
  return <StyledItem ref={ref} {...props} $inset={inset} $colorMode={colorMode} />;
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
  $color: string,
}>`
  margin: 0.25rem -0.25rem;
  height: 1px;
  background-color: ${({ $color }) => $color};
`;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const { colors } = useDesign();
  return <StyledSeparator ref={ref} {...props} $color={colors.neutralColor} />;
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
