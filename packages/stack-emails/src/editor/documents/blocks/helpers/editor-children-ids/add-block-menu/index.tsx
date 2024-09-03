"use client";

import { CirclePlus } from "lucide-react";
import { TEditorBlock } from "../../../../editor/core";
import BlocksPopover from "./blocks-menu";

type Props = {
  placeholder?: boolean;
  onSelect: (block: TEditorBlock) => void;
};
export default function AddBlockButton({ onSelect, placeholder }: Props) {
  const renderButton = () => {
    if (placeholder) {
      return (
        <button
          onClick={(ev) => {
            ev.stopPropagation();
          }}
          className="flex h-12 w-full items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-100"
        >
          <CirclePlus className="h-5 w-5 text-black" />
        </button>
      );
    } else {
      return (
        <button
          className="absolute left-1/2 top-[-12px] z-10 -translate-x-1/2 transform rounded-full bg-white p-1 shadow"
          onClick={(ev) => {
            ev.stopPropagation();
          }}
        >
          <CirclePlus className="h-5 w-5" />
        </button>
      );
    }
  };

  return (
    <div className="relative">
      <BlocksPopover trigger={renderButton()} onSelect={onSelect} />
    </div>
  );
}
