"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import styled from 'styled-components';
import { FONT_FAMILY, FONT_SIZES, SECONDARY_FONT_COLORS } from "../utils/constants";
import { useDesign } from "../utils/design-provider";

const Primitive = styled(LabelPrimitive.Root)<{ color: string }>`
  font-size: ${FONT_SIZES.sm};
  line-height: 1;
  color: ${props => props.color};
  font-weight: 500;
  font-family: ${FONT_FAMILY};
  display: block;
  margin-bottom: 0.5rem;
`;

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(
  (props , ref) => {
    const { currentTheme } = useDesign();
    return <Primitive
      color={currentTheme === 'dark' ? SECONDARY_FONT_COLORS.dark : SECONDARY_FONT_COLORS.light}
      ref={ref}
      {...props}
    />;
  }
);
Label.displayName = LabelPrimitive.Root.displayName;

export default Label;
