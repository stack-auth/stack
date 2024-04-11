'use client';

import Link from "next/link";
import { useDesign, UserButton } from "@stackframe/stack";
import ColorMode from "./color-mode";
import Select from "./select";
import { useCurrentUI } from "./provider";

export default function Header() {
  const { colors, colorMode } = useDesign();
  const [currentUI, setCurrentUI] = useCurrentUI();
  return (
    <div 
      className={"absolute w-full top-0 z-50 p-4 h-12 flex items-center py-4 border-b justify-between"}
      style={{
        borderColor: colors.neutralColor
      }}
    >
      <Link href="/" className="font-semibold">
      Stack Demo
      </Link>

      <div className="flex items-center justify-end gap-5">
        <Select 
          options={[
            { value: 'default', label: 'Default UI' },
            { value: 'joy', label: 'Joy UI' }
          ]}
          value={currentUI}
          onChange={(e) => setCurrentUI(e.target.value as any)}
        />
        <ColorMode />
        <UserButton />
      </div>
    </div>
  );
}