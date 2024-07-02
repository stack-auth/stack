import { Input } from '../../../../../../components/ui/input';
import { Label } from '../../../../../../components/ui/label';
import { Textarea } from '../../../../../../components/ui/textarea';
import React, { useState } from 'react';

type Props = {
  label: string,
  rows?: number,
  placeholder?: string,
  helperText?: string | JSX.Element,
  defaultValue: string,
  onChange: (v: string) => void,
};

export default function TextInput({ helperText, label, placeholder, rows, defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const isMultiline = typeof rows === 'number' && rows > 1;

  return (
    <div className='flex flex-col gap-2'>
      <Label>{label}</Label>
      {isMultiline ? (
        <Textarea
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(ev) => {
            const v = ev.target.value;
            setValue(v);
            onChange(v);
          }}
        />
      ) : (
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(ev) => {
            const v = ev.target.value;
            setValue(v);
            onChange(v);
          }}
        />
      )}
      {helperText && <p className="mt-2 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}
