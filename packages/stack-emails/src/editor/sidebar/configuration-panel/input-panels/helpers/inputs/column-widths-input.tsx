import React, { useState } from 'react';
import TextDimensionInput from './text-dimension-input';

export const DEFAULT_2_COLUMNS = [6] as [number];
export const DEFAULT_3_COLUMNS = [4, 8] as [number, number];

type TWidthValue = number | null | undefined;
type FixedWidths = [
  //
  number | null | undefined,
  number | null | undefined,
  number | null | undefined,
];
type ColumnsLayoutInputProps = {
  defaultValue: FixedWidths | null | undefined,
  onChange: (v: FixedWidths | null | undefined) => void,
  columnsCount: 2 | 3,
};
export default function ColumnWidthsInput({ defaultValue, onChange, columnsCount }: ColumnsLayoutInputProps) {
  const [currentValue, setCurrentValue] = useState<[TWidthValue, TWidthValue, TWidthValue]>(() => {
    if (defaultValue) {
      return defaultValue;
    }
    return [null, null, null];
  });

  const setIndexValue = (index: 0 | 1 | 2, value: number | null | undefined) => {
    const nValue: FixedWidths = [...currentValue];
    nValue[index] = value;
    setCurrentValue(nValue);
    onChange(nValue);
  };

  let column3 = null;
  if (columnsCount === 3) {
    column3 = (
      <TextDimensionInput
        label="Column 3"
        defaultValue={currentValue[2]}
        onChange={(v) => {
          setIndexValue(2, v);
        }}
      />
    );
  }
  return (
    <div className='flex gap-1'>
      <TextDimensionInput
        label="Column 1"
        defaultValue={currentValue[0]}
        onChange={(v) => {
          setIndexValue(0, v);
        }}
      />
      <TextDimensionInput
        label="Column 2"
        defaultValue={currentValue[1]}
        onChange={(v) => {
          setIndexValue(1, v);
        }}
      />
      {column3}
    </div>
  );
}
