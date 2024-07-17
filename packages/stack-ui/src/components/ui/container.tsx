'use client';

import React, { useId } from 'react';

type ContainerProps = {
  size: number,
} & Omit<React.HTMLProps<HTMLDivElement>, 'size'>

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(({
  size,
  ...props
}, ref) => {
  const styleId = useId().replaceAll(':', '-');
  const styleSheet = `
  .stack-inner-container-${styleId} {
    max-width: 100%;
  }
  @media (min-width: ${size}px) {
    .stack-inner-container-${styleId} {
      width: ${size}px;
    }
  }
  `;

  return (
    <>
      <style>{styleSheet}</style>
      <div className="flex justify-center w-full">
        <div className={`stack-inner-container-${styleId}`} {...props} ref={ref}>
          {props.children}
        </div>
      </div>
    </>
  );
});

export { Container };
