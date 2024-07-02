import { Input } from '../../../../../../components/ui/input';
import React from 'react';

type TextDimensionInputProps = {
  label: string,
  defaultValue: number | null | undefined,
  onChange: (v: number | null) => void,
};

export default function TextDimensionInput({ label, defaultValue, onChange }: TextDimensionInputProps) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (ev) => {
    const value = parseInt(ev.target.value);
    onChange(isNaN(value) ? null : value);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <Input
          className="block w-full pr-10"
          onChange={handleChange}
          defaultValue={defaultValue !== null && defaultValue !== undefined ? defaultValue : ''}
          placeholder="auto"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">px</span>
        </div>
      </div>
    </div>
  );
}
