'use client';
import { useDesign, useElements } from "@stackframe/stack-ui";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ColorMode() {
  const {colorMode, setColorMode} = useDesign();
  const { Button } = useElements();

  return (
    <Button 
      variant="secondary"
      size='sm' 
      onClick={() => setColorMode(colorMode === 'light' ? 'dark' : 'light')}
    >
      {colorMode === 'light' ? 'Dark' : 'Light'} Mode
    </Button>
  );
}
