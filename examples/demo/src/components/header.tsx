'use client';

import Link from "next/link";
import { useDesign, UserButton, ColorPalette } from "@stackframe/stack";
import { useTheme } from "next-themes";
import styled from "styled-components";

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
          <UserButton colorModeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        </div>
      </StyledHeader>
      <div className="min-h-12"/> {/* Placeholder for fixed header */}
    </>
  );
}