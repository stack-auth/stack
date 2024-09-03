import React from "react";
import { Label, ToggleGroup, ToggleGroupItem } from "@stackframe/stack-ui";

export function SingleToggleGroup(props: {
  label: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: React.ReactNode }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{props.label}</Label>
      <ToggleGroup type="single" value={props.value} onValueChange={props.onValueChange} className="flex">
        {props.items.map((item) => (
          <ToggleGroupItem value={item.value} className="flex-1" key={item.value} variant="outline" size="sm">
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
