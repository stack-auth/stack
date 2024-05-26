import React from 'react';

type Props = {
  paletteColors: string[],
  value: string,
  onChange: (value: string) => void,
};

export default function ColorSwatch({ paletteColors, value, onChange }: Props) {
  const renderButton = (colorValue: string) => {
    return (
      <button
        key={colorValue}
        onClick={() => onChange(colorValue)}
        className={`w-6 h-6 bg-[${colorValue}] border ${value === colorValue ? 'border-black' : 'border-gray-200'} inline-flex min-w-[24px]`}
        style={{ backgroundColor: colorValue }}
      />
    );
  };

  return (
    <div className="w-full grid gap-1 grid-cols-6">
      {paletteColors.map((c) => renderButton(c))}
    </div>
  );
}
