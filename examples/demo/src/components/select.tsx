import React from 'react';
import styled from 'styled-components';
import { IoIosArrowDown } from 'react-icons/io';
import { useDesign, ColorPalette } from '@stackframe/stack';

const SelectWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const StyledSelect = styled.select<{ $colors: ColorPalette }>`
  padding: 3px 5px;
  padding-right: 30px;
  display: inline-block;
  border-radius: 4px;
  box-sizing: border-box;
  appearance: none;

  border: 1px solid ${props => props.$colors.light.neutralColor};
  background-color: ${props => props.$colors.light.backgroundColor};

  html[data-stack-theme='dark'] & {
    border-color: ${props => props.$colors.dark.neutralColor};
    background-color: ${props => props.$colors.dark.backgroundColor};
  }
`;

const StyledOption = styled.option`
`;

const ChevronIcon = styled(IoIosArrowDown)`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
`;

const Select = ({ options, ...props }) => {
  const { colors } = useDesign();
  return (
    <SelectWrapper>
      <StyledSelect {...props} $colors={colors}>
        {options.map(option => (
          <StyledOption key={option.value} value={option.value}>
            {option.label}
          </StyledOption>
        ))}
      </StyledSelect>
      <ChevronIcon />
    </SelectWrapper>
  );
};

export default Select;
