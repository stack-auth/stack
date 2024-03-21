'use client';

import React from "react";
import { useDesign } from "../providers/design-provider";
import styled from 'styled-components';
import { BORDER_RADIUS, FONT_FAMILY, FONT_SIZES, PRIMARY_FONT_COLORS, SECONDARY_FONT_COLORS } from "../utils/constants";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & Pick<React.HTMLProps<HTMLInputElement>, 'ref'>

const StyledInput = styled.input<{
  $borderColor: string,
  $focusShadowColor: string,
  $backgroundColor: string,
  $textColor: string,
  $placeholderColor: string,
  $fileSelectorColor: string,
  $fileSelectorButtonColor: string,
}>`
  font-family: ${FONT_FAMILY};
  font-size: ${FONT_SIZES.md};
  height: 2.5rem;
  border-radius: ${BORDER_RADIUS};
  border: 1px solid;
  border-color: ${props => props.$borderColor};
  background-color: ${props => props.$backgroundColor};
  padding: 0rem 1rem;
  color: ${props => props.$textColor};
  &::placeholder {
    color: ${props => props.$placeholderColor};
  }
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.$focusShadowColor};
  }
  &:disabled {
    cursor: auto;
    opacity: 0.5;
  }
  &[type=file] {
    color: ${props => props.$fileSelectorColor};
  }
  &[type=file]::file-selector-button{
    border: none;
    color: ${props => props.$fileSelectorButtonColor};
    background-color: transparent;
    height: 2.5rem;
    margin-right: 0.5rem;
    padding: 0;
  }
`;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const { colors, colorMode } = useDesign();
    return (
      <StyledInput
        ref={ref}
        $backgroundColor={colors.primaryBgColor}
        $borderColor={colors.neutralColor}
        $placeholderColor={SECONDARY_FONT_COLORS[colorMode]}
        $textColor={PRIMARY_FONT_COLORS[colorMode]}
        $fileSelectorColor={SECONDARY_FONT_COLORS[colorMode]}
        $fileSelectorButtonColor={PRIMARY_FONT_COLORS[colorMode]}
        $focusShadowColor={colors.primaryColor}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export default Input;