import { CircleSlash, Plus } from "lucide-react";
import React, { useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { Label } from "@stackframe/stack-ui";

type Props =
  | {
      nullable: true;
      label: string;
      onChange: (value: string | null) => void;
      defaultValue: string | null;
    }
  | {
      nullable: false;
      label: string;
      onChange: (value: string) => void;
      defaultValue: string;
    };

export default function ColorInput({ label, defaultValue, onChange, nullable }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [value, setValue] = useState(defaultValue);
  const handleClickOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const renderResetButton = () => {
    if (!nullable) {
      return null;
    }
    if (typeof value !== "string" || value.trim().length === 0) {
      return null;
    }
    return (
      <button
        onClick={() => {
          setValue(null);
          onChange(null);
        }}
        className="flex items-center justify-center p-1"
      >
        <CircleSlash className="h-4 w-4" />
      </button>
    );
  };

  const renderOpenButton = () => {
    if (value) {
      return (
        <button
          onClick={handleClickOpen}
          className="border-cadet-400 h-7 w-7 min-w-7 rounded border bg-white"
          style={{ backgroundColor: value }}
        />
      );
    }
    return (
      <button
        onClick={handleClickOpen}
        className="border-cadet-400 flex h-7 w-7 min-w-7 items-center justify-center rounded border bg-white"
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  };

  return (
    <div className="flex flex-col items-start">
      <Label className="mb-2">{label}</Label>
      <div className="flex items-center gap-2">
        {renderOpenButton()}
        <HexColorInput
          prefixed
          color={value || ""}
          onChange={(v) => {
            setValue(v);
            onChange(v);
          }}
          className="border-input focus-visible:ring-ring flex h-7 w-24 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm
            focus-visible:outline-none focus-visible:ring-1"
        />
        {renderResetButton()}
      </div>
      {anchorEl && (
        <div
          className="absolute z-10 mt-2 w-64 rounded-lg border border-gray-300 bg-white shadow-lg"
          onMouseLeave={() => setAnchorEl(null)}
        >
          <div className="space-y-4 p-4">
            <HexColorPicker
              color={value || ""}
              onChange={(v) => {
                setValue(v);
                onChange(v);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
