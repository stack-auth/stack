'use client';

import { filterUndefined } from '@stackframe/stack-shared/dist/utils/objects';
import React from 'react';

type ContainerProps = {
  size: number,
} & Omit<React.HTMLProps<HTMLDivElement>, 'size'>

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(({
  size,
  ...props
}, ref) => {
  return (
    <>
      <div className="flex justify-center w-full">
        <div
          {...props}
          ref={ref}
          style={{ width: '100%', maxWidth: size, ...props.style ? filterUndefined(props.style) : {} }}
        >
          {props.children}
        </div>
      </div>
    </>
  );
});

export { Container };
