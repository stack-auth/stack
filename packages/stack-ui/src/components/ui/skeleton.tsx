"use client";

import React from "react";
import { cn } from "../..";

// TODO: add this to the generated global CSS
const styleSheet = `
@keyframes animation-light {
0% {
  filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.8);
}
100% {
  filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.9);
}

@keyframes animation-dark {
0% {
  filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.2);
}
100% {
  filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.1);
}

.stack-skeleton[data-stack-state="activated"],
.stack-skeleton[data-stack-state="activated"] * {
  pointer-events: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  user-select: none !important;
  cursor: default !important;
}

.stack-skeleton[data-stack-state="activated"] {
  animation: animation-light 1s infinite alternate-reverse !important;
}

html[data-stack-theme='dark'] .stack-skeleton[data-stack-state="activated"] {
  animation: animation-dark 1s infinite alternate-reverse !important;
}

html[data-stack-theme='dark'] .stack-skeleton[data-stack-state="activated"] {
  animation: animation-dark 1s infinite alternate-reverse !important;
}
`;

const Skeleton = React.forwardRef<React.ElementRef<"span">, React.ComponentPropsWithoutRef<"span"> & { deactivated?: boolean }>(
  (props, ref) => {
    return (
      <>
        <style>{styleSheet}</style>
        <span
          {...props}
          ref={ref}
          data-stack-state={props.deactivated ? "deactivated" : "activated"}
          className={cn(props.className, "stack-skeleton")}
        />
      </>
    );
  },
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
