"use client";

import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import styled from 'styled-components';
import { FONT_FAMILY, FONT_SIZES, SECONDARY_FONT_COLORS } from "../utils/constants";

const Primitive = styled(LabelPrimitive.Root)`
  font-size: ${FONT_SIZES.sm};
  line-height: 1.5rem;
  font-weight: 400;
  font-family: ${FONT_FAMILY};
  display: block;

  color: ${SECONDARY_FONT_COLORS.light};

  html[data-stack-theme='dark'] & {
    color: ${SECONDARY_FONT_COLORS.dark};
  }
`;

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(
  (props, ref) => {
    return <Primitive
      ref={ref}
      {...props}
    />;
  }
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
