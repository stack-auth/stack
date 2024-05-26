import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from '@/components/ui/label';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';

type Props = {
  label: string,
  defaultValue: string | null,
  onChange: (value: string | null) => void,
};

export default function TextAlignInput({ label, defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue ?? 'left');

  return (
    <div>
      <Label>{label}</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(value) => {
          setValue(value);
          onChange(value);
        }}
        className="flex space-x-2 mt-2"
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
