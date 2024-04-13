'use client';

import React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import styled from 'styled-components';
import { useDesign } from '..';

const StyledDivider = styled(SeparatorPrimitive.Root)<{ 
  $orientation: string,
  $color: string,
}>`
  flex-shrink: 0;
  background-color: ${props => props.$color};
  
  ${(props) =>
    props.$orientation === 'horizontal'
      ? 'height: 1px; width: 100%;'
      : 'height: 100%; width: 1px;'}
`;

const Divider = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ orientation = 'horizontal', decorative = true, ...props }, ref) => {
  const { colors } = useDesign();

  return <StyledDivider
    ref={ref}
    decorative={decorative}
    $orientation={orientation}
    $color={colors.neutralColor}
    {...props}
  />;
});

Divider.displayName = 'Separator';

export { Divider };
