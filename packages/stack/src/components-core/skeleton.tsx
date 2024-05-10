"use client";

import React from "react";
import styled, { keyframes } from 'styled-components';

const getFilterString = (brightness1: number, brightness2: number) => {
  return `
    0% {
      filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(${brightness1});
    }
    100% {
      filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(${brightness2});
    }
  `;
};

const animationLight = keyframes`${getFilterString(0.8, 0.9)}`;
const animationDark = keyframes`${getFilterString(0.2, 0.1)}`;

const Primitive = styled("span")`
  &[data-stack-state="activated"], &[data-stack-state="activated"] * {
    pointer-events: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    user-select: none !important;
    cursor: default !important;
  }

  &[data-stack-state="activated"] {
    animation: ${animationLight} 1s infinite alternate-reverse !important;
  }

  html[data-stack-theme='dark'] &[data-stack-state="activated"] {
    animation: ${animationDark} 1s infinite alternate-reverse !important;
  }
`;

const Skeleton = React.forwardRef<
  React.ElementRef<"span">,
  React.ComponentPropsWithoutRef<"span"> & { deactivated?: boolean }
>(
  (props, ref) => {
    return <Primitive
      ref={ref}
      data-stack-state={props.deactivated ? "deactivated" : "activated"}
      {...props}
    />;
  }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
