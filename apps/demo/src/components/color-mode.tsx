'use client';
import { Button, useDesign } from "@stackframe/stack-ui";

export default function ColorMode() {
  const {colorMode, setColorMode} = useDesign();

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
