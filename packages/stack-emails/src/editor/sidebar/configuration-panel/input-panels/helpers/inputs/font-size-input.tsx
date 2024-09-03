import { Text } from "lucide-react";
import { useState } from "react";
import { Label } from "@stackframe/stack-ui";
import RawSliderInput from "./raw/raw-slider-input";

type Props = {
  label: string;
  defaultValue: number;
  onChange: (v: number) => void;
};
export default function FontSizeInput({ label, defaultValue, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const handleChange = (value: number) => {
    setValue(value);
    onChange(value);
  };
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <RawSliderInput
        iconLabel={<Text className="h-4 w-4" />}
        value={value}
        setValue={handleChange}
        units="px"
        step={1}
        min={10}
        max={48}
      />
    </div>
  );
}
