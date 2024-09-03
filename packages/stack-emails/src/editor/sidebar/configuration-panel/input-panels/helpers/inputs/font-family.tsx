import { useState } from "react";
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@stackframe/stack-ui";
import { FONT_FAMILIES } from "../../../../../documents/blocks/helpers/font-family";

const OPTIONS = FONT_FAMILIES.map((option) => (
  <SelectItem key={option.key} value={option.key} style={{ fontFamily: option.value }}>
    {option.label}
  </SelectItem>
));

type NullableProps = {
  label: string;
  onChange: (value: null | string) => void;
  defaultValue: null | string;
};

export function NullableFontFamily({ label, onChange, defaultValue }: NullableProps) {
  const [value, setValue] = useState(defaultValue ?? "inherit");

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onChange(v === "inherit" ? null : v);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Match email settings" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inherit">Match email settings</SelectItem>
          {OPTIONS}
        </SelectContent>
      </Select>
    </div>
  );
}
