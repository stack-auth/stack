'use client';

import React from "react";
import { ColorPalette, useDesign } from "../providers/design-provider";
import styled from 'styled-components';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZES, PRIMARY_FONT_COLORS, SECONDARY_FONT_COLORS } from "../utils/constants";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & Pick<React.HTMLProps<HTMLInputElement>, 'ref'>


const StyledInput = styled.input<{
  $colors: ColorPalette,
}>`
  font-family: ${FONT_FAMILY};
  font-size: ${FONT_SIZES.md};
  height: 2.5rem;
  border-radius: ${BORDER_RADIUS};
  background-color: transparent;
  border: 1px solid;
  padding: 0rem 1rem;
  &:disabled {
    cursor: auto;
    opacity: 0.5;
  }
  &[type=file]::file-selector-button{
    border: none;
    background-color: transparent;
    height: 2.5rem;
    margin-right: 0.5rem;
    padding: 0;
  }

  border-color: ${props => props.$colors.light.neutralColor};
  color: ${PRIMARY_FONT_COLORS.light};
  &::placeholder {
    color: ${SECONDARY_FONT_COLORS.light};
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.$colors.light.primaryColor};
  }
  &[type=file] {
    color: ${SECONDARY_FONT_COLORS.light};
  }
  &[type=file]::file-selector-button{
    color: ${PRIMARY_FONT_COLORS.light};
  }

  html[data-stack-theme='dark'] & {
    border-color: ${props => props.$colors.dark.neutralColor};
    color: ${PRIMARY_FONT_COLORS.dark};
    &::placeholder {
      color: ${SECONDARY_FONT_COLORS.dark};
    }
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px ${props => props.$colors.dark.primaryColor};
    }
    &[type=file] {
      color: ${SECONDARY_FONT_COLORS.dark};
    }
    &[type=file]::file-selector-button{
      color: ${PRIMARY_FONT_COLORS.dark};
    }
  }
`;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const { colors } = useDesign();
    return (
      <StyledInput
        ref={ref}
        $colors={colors}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };