"use client";

import React from "react";
import styled, { keyframes } from 'styled-components';
import { FONT_FAMILY, FONT_SIZES, SECONDARY_FONT_COLORS } from "../utils/constants";
import { useDesign } from "../providers/design-provider";

const animation = keyframes`
  0% {
    filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.8);
  }
  100% {
    filter: grayscale(1) contrast(0) brightness(0) invert(1) brightness(0.7);
  }
`;

const Primitive = styled("span")<{ $color: string }>`
  &[data-stack-state="activated"] {
    animation: ${animation} 1s infinite alternate-reverse !important;
  }
  &[data-stack-state="activated"], &[data-stack-state="activated"] * {
    pointer-events: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    user-select: none !important;
    cursor: default !important;
  }
`;

const Skeleton = React.forwardRef<
  React.ElementRef<"span">,
  React.ComponentPropsWithoutRef<"span"> & { deactivated?: boolean }
>(
  (props, ref) => {
    const { colorMode } = useDesign();
    return <Primitive
      $color={colorMode === 'dark' ? SECONDARY_FONT_COLORS.dark : SECONDARY_FONT_COLORS.light}
      ref={ref}
      data-stack-state={props.deactivated ? "deactivated" : "activated"}
      {...props}
    />;
  }
);
Skeleton.displayName = "Skeleton";


export function Abc() {

  return <>
    <style>
      .kljahsdflkjshdfjklashjlkdfjlhkasdfhjlks {

      }
    </style>
  </>;
}

export { Skeleton };
