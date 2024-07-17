'use client';

import React from 'react';

type ContainerProps = {
  size: number,
} & Omit<React.HTMLProps<HTMLDivElement>, 'size'>

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(({
  size,
  ...props
}, ref) => {
  const styleSheet = `
    @media (min-width: ${size}px) {
      .stack-inner-container {
        width: ${size}px;
      }
    }
  `;

  return (
    <>
      <style>{styleSheet}</style>
      <div className="flex justify-center w-full">
        <div className="w-full" {...props} ref={ref}>
          {props.children}
        </div>
      </div>
    </>
  );
});

export { Container };
