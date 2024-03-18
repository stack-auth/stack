'use client';

import Link from "next/link";
import { useDesign } from "@stackframe/stack-ui";
import ColorMode from "./color-mode";

export default function Header() {
  const { colors, colorMode } = useDesign();
  return (
    <div 
      className={"sticky top-0 z-50 p-4 h-12 flex justify-between items-center py-4 border-b"} 
      style={{
        borderColor: colors.neutralColor
      }}
    >
      <Link href="/" className="font-semibold">
      Stack Demo
      </Link>
      <ColorMode />
    </div>
  );
}