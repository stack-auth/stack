import React from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

import ColorSwatch from './color-swatch';

const DEFAULT_PRESET_COLORS = [
  '#E11D48',
  '#DB2777',
  '#C026D3',
  '#9333EA',
  '#7C3AED',
  '#4F46E5',
  '#2563EB',
  '#0284C7',
  '#0891B2',
  '#0D9488',
  '#059669',
  '#16A34A',
  '#65A30D',
  '#CA8A04',
  '#D97706',
  '#EA580C',
  '#DC2626',
  '#FFFFFF',
  '#FAFAFA',
  '#F5F5F5',
  '#E5E5E5',
  '#D4D4D4',
  '#A3A3A3',
  '#737373',
  '#525252',
  '#404040',
  '#262626',
  '#171717',
  '#0A0A0A',
  '#000000',
];

const SX = {
  '.react-colorful__pointer': {
    width: '4rem',
    height: '4rem',
  },
  '.react-colorful__saturation': {
    marginBottom: '0.25rem',
    borderRadius: '0.25rem',
  },
  '.react-colorful__last-control': {
    borderRadius: '0.25rem',
  },
  '.react-colorful__hue-pointer': {
    width: '0.25rem',
    borderRadius: '0.25rem',
    height: '1.5rem',
    cursor: 'col-resize',
  },
  '.react-colorful__saturation-pointer': {
    cursor: 'all-scroll',
  },
  input: {
    padding: '0.25rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.25rem',
    width: '100%',
  },
};

type Props = {
  value: string,
  onChange: (v: string) => void,
};
export default function Picker({ value, onChange }: Props) {
  return (
    <div className="space-y-4 p-2 border rounded-lg">
      <HexColorPicker color={value} onChange={onChange} />
      <ColorSwatch paletteColors={DEFAULT_PRESET_COLORS} value={value} onChange={onChange} />
      <HexColorInput prefixed color={value} onChange={onChange} className="p-1 border border-gray-300 rounded w-full" />
    </div>
  );
}
