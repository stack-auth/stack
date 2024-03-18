import React from 'react';
import styled from 'styled-components';
import { IoIosArrowDown } from 'react-icons/io';
import { useDesign } from '@stackframe/stack-ui';

const SelectWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const StyledSelect = styled.select<{bgColor: string, borderColor: string}>`
  padding: 3px 5px;
  display: inline-block;
  border: 1px solid ${props => props.borderColor};
  border-radius: 4px;
  box-sizing: border-box;
  background-color: ${props => props.bgColor};
`;

const StyledOption = styled.option`
`;

const Select = ({ options, ...props }) => {
  const { colors } = useDesign();
  return (
    <SelectWrapper>
      <StyledSelect {...props} bgColor={colors.primaryBgColor} borderColor={colors.neutralColor}>
        {options.map(option => (
          <StyledOption key={option.value} value={option.value}>
            {option.label}
          </StyledOption>
        ))}
      </StyledSelect>
    </SelectWrapper>
  );
};

export default Select;
