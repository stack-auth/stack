import { useState } from "react";
import { Label } from "@stackframe/stack-ui";
import RawSliderInput from "./raw/raw-slider-input";

type SliderInputProps = {
  label: string;
  iconLabel: JSX.Element;
  step?: number;
  units: string;
  min?: number;
  max?: number;

  defaultValue: number;
  onChange: (v: number) => void;
};

export default function SliderInput({ label, defaultValue, onChange, ...props }: SliderInputProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <RawSliderInput
        value={value}
        setValue={(value: number) => {
          setValue(value);
          onChange(value);
        }}
        {...props}
      />
    </div>
  );
}
