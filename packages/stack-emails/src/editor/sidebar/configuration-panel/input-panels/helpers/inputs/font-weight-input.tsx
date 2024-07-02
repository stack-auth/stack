import { useState } from 'react';
import { SingleToggleGroup } from './single-toggle-group';

type Props = {
  label: string,
  defaultValue: string,
  onChange: (value: string) => void,
};

export default function FontWeightInput({ label, defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);

  return (
    <SingleToggleGroup
      label={label}
      value={value}
      onValueChange={(fontWeight) => {
        setValue(fontWeight);
        onChange(fontWeight);
      }}
      items={[
        { value: 'normal', label: 'Regular' },
        { value: 'bold', label: 'Bold' },
      ]}
    />
  );
}
