import { useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { SingleToggleGroup } from './single-toggle-group';

type Props = {
  label: string,
  defaultValue: string | null,
  onChange: (value: string | null) => void,
};

export default function TextAlignInput({ label, defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue ?? 'left');

  return (
    <SingleToggleGroup
      label={label}
      value={value}
      onValueChange={(textAlign) => {
        setValue(textAlign);
        onChange(textAlign);
      }}
      items={[
        { value: 'left', label: <AlignLeft className="h-4 w-4" /> },
        { value: 'center', label: <AlignCenter className="h-4 w-4" /> },
        { value: 'right', label: <AlignRight className="h-4 w-4" /> },
      ]}
    />
  );
}
