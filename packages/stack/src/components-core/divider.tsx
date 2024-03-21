'use client';

import React from "react";
import { useDesign } from "../providers/design-provider";

export type DividerProps = { direction?: 'horizontal' | 'vertical'} & React.HTMLProps<HTMLHRElement>;

const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ direction='horizontal' }, ref) => {
    const { colors } = useDesign();
    return <hr 
      ref={ref} 
      style={{ 
        width: direction === 'horizontal' ? undefined : '1px', 
        height: direction === 'horizontal' ? '1px' : undefined,
        border: 'none', 
        backgroundColor: colors.neutralColor,
        margin: 0,
        padding: 0,
      }} />;
  }
);
Divider.displayName = 'Divider';

export default Divider;