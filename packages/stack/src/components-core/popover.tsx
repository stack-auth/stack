import React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import styled, { css } from 'styled-components';
import { useDesign } from '..';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const StyledContent = styled(PopoverPrimitive.Content)<{
  $bgColor: string,
  $borderColor: string,
}>`
  z-index: 50;
  width: 18rem;
  border-radius: 0.375rem;
  border: 1px solid ${({ $borderColor }) => $borderColor};
  background-color: ${({ $bgColor }) => $bgColor};
  padding: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  outline: none;
  ${({ className }) => className && css`${className}`};
`;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => {
  const { colors } = useDesign();
  return (
    <PopoverPrimitive.Portal>
      <StyledContent
        $borderColor={colors.neutralColor}
        $bgColor={colors.backgroundColor}
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={className}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };
