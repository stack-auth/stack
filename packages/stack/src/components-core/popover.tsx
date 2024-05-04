import React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import styled, { css } from 'styled-components';
import { useDesign } from '..';
import { ColorPalette } from '../providers/design-provider';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const StyledContent = styled(PopoverPrimitive.Content)<{
  $colors: ColorPalette,
}>`
  z-index: 50;
  width: 18rem;
  border-radius: 0.375rem;
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  outline: none;

  border: 1px solid ${({ $colors }) => $colors.light.neutralColor};
  background-color: ${({ $colors }) => $colors.light.backgroundColor};

  html[data-theme='dark'] & {
    border-color: ${({ $colors }) => $colors.dark.neutralColor};
    background-color: ${({ $colors }) => $colors.dark.backgroundColor};
  }
`;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ align = 'center', sideOffset = 4, ...props }, ref) => {
  const { colors } = useDesign();
  return (
    <PopoverPrimitive.Portal>
      <StyledContent
        $colors={colors}
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };
