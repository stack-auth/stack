'use client';

import React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import styled from 'styled-components';
import { useDesign } from '..';
import { ColorPalette } from '../providers/design-provider';

const StyledSeparator = styled(SeparatorPrimitive.Root)<{ 
  $orientation: string,
  $color: ColorPalette,
}>`
  flex-shrink: 0;
  ${(props) =>
    props.$orientation === 'horizontal'
      ? 'height: 1px; width: 100%;'
      : 'height: 100%; width: 1px;'}
  
  background-color: ${props => props.$color.light.neutralColor};

  html[data-stack-theme='dark'] & {
    background-color: ${props => props.$color.dark.neutralColor};
  }
`;

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ orientation = 'horizontal', decorative = true, ...props }, ref) => {
  const { colors } = useDesign();

  return <StyledSeparator
    ref={ref}
    decorative={decorative}
    $orientation={orientation}
    $color={colors}
    {...props}
  />;
});

Separator.displayName = 'Separator';

export { Separator };
