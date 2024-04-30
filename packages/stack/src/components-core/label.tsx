"use client";

import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import styled from 'styled-components';
import { FONT_FAMILY, FONT_SIZES, SECONDARY_FONT_COLORS } from "../utils/constants";
import { useDesign } from "../providers/design-provider";

const Primitive = styled(LabelPrimitive.Root)`
  font-size: ${FONT_SIZES.sm};
  line-height: 1;
  font-weight: 500;
  font-family: ${FONT_FAMILY};
  display: block;
  margin-bottom: 0.5rem;

  color: ${SECONDARY_FONT_COLORS.light};

  html[data-theme='dark'] & {
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
