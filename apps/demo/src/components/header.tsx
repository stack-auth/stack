'use client';

import Link from "next/link";
import { useDesign, UserButton, ColorPalette } from "@stackframe/stack";
import { useTheme } from "next-themes";
import styled from "styled-components";
import ColorMode from "./color-mode";
import Select from "./select";
import { useCurrentUI } from "./provider";

const StyledHeader = styled.div<{ $colors: ColorPalette }>`
  border-bottom: 1px solid ${props => props.$colors.light.neutralColor};
  background-color: ${props => props.$colors.light.backgroundColor};

  html[data-stack-theme='dark'] & {
    border-color: ${props => props.$colors.dark.neutralColor};
    background-color: ${props => props.$colors.dark.backgroundColor};
  }
`;

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { colors } = useDesign();
  const { ui, setUi } = useCurrentUI();

  return (
    <>
      <StyledHeader
        $colors={colors}
        className={"fixed w-full z-50 p-4 h-12 flex items-center py-4 border-b justify-between"}
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
            value={ui}
            onChange={(e) => setUi(e.target.value as any)}
          />
          <ColorMode />
          <UserButton colorModeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </div>
      </StyledHeader>
      <div className="min-h-12"/> {/* Placeholder for fixed header */}
    </>
  );
}