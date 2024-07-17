"use client";

import React from "react";

const styleSheet = `
@keyframes animation-light {
0% {
  filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.8);
}
100% {
  filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.9);
}
}

/* keyframes for dark theme animation */
@keyframes animation-dark {
0% {
  filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.2);
}
100% {
  filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.1);
}
}

.primitive[data-stack-state="activated"],
.primitive[data-stack-state="activated"] * {
pointer-events: none !important;
-webkit-user-select: none !important;
-moz-user-select: none !important;
user-select: none !important;
cursor: default !important;
}

.primitive[data-stack-state="activated"] {
animation: animation-light 1s infinite alternate-reverse !important;
}

html[data-stack-theme='dark'] .primitive[data-stack-state="activated"] {
animation: animation-dark 1s infinite alternate-reverse !important;
}
`;

const Skeleton = React.forwardRef<
  React.ElementRef<"span">,
  React.ComponentPropsWithoutRef<"span"> & { deactivated?: boolean }
>(
  (props, ref) => {
    return <>
      <style>{styleSheet}</style>
      <span
        ref={ref}
        data-stack-state={props.deactivated ? "deactivated" : "activated"}
        {...props}
      />;
    </>;
  }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
