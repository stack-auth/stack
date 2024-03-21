---
sidebar_position: 1
title: Colors & Color Mode
---

# Colors and Color Mode

## Color Scheme

If you want to spend minimal time on styling but still want to align with your brand, you can customize the colors of the Stack app. Colors are stored in React context and can be easily overridden.

There are five variables that you can override:
- `primaryColor`: The primary color used for components like button with primary variant.
- `secondaryColor`: The secondary color used for components like button with secondary variant.
- `neutralColor`: The color used for dividers and borders.
- `backgroundColor`: The background color of your the main content area, should be the same the color of your `body` element.

These colors can be different for light and dark mode. You can pass these into the `StackTheme` component (in your `layout.tsx` file if you followed the get started guide) as follows:

```jsx
const theme = {
  colors: {
    light: {
      primaryColor: '#570df8',
      secondaryColor: '#e0e0e0',
      backgroundColor: 'white',
      neutralColor: '#e4e4e7',
    },
    dark: {
      primaryColor: '#570df8',
      secondaryColor: '#404040',
      backgroundColor: 'black',
      neutralColor: '#27272a',
    },
  }
}

// ...

<StackTheme theme={theme}>
  {/* children */}
</StackTheme>
```

To get the current color scheme, you can use the `useDesign` hook. This hook will return `colors` object which contains the current color scheme respecting the color mode. Here is an example of a custom rectangle component that uses the color scheme:

```jsx
'use client';
import { useDesign } from '@stackframe/stack';

export default function Rectangle() {
  const { colors } = useDesign();
  return (
    <div
      style={{
        width: 100,
        height: 100,
        backgroundColor: colors.primaryColor,
      }}
    />
  );
}
```


## Color Mode

To get the current color mode or change it, you can use the `useDesign` hook. This hook will return `colorMode` and `setColorMode` functions. Here is an example of how you can build a color mode switcher:

```jsx
'use client';
import { Button, useDesign } from '@stackframe/stack'

export default function ColorModeSwitcher() {
  const { colorMode, setColorMode } = useDesign()
  return (
    <Button onClick={() => setColorMode(colorMode === 'light' ? 'dark' : 'light')}>
      {colorMode === 'light' ? 'Dark' : 'Light'} Mode
    </Button>
  )
}
```


### Color Mode Configs

Stack by default uses [next-themes](https://github.com/pacocoursey/next-themes) to handle dark/light mode. You can pass in almost the same configs as next-themes to the `StackTheme` to customize the color mode.

```jsx
const colorModeConfig = {
  defaultTheme: 'dark',
}

// ...

<StackTheme colorModeConfig={colorModeConfig}>
  {/* children */}
</StackTheme>
```

### Using next-themes provider with Stack

If you also use next-themes in your app, you can just wrap the next-themes' `ThemeProvider` around the `StackTheme` and it will automatically work with your existing color mode setup.

```jsx
import { ThemeProvider } from 'next-themes'

// ...

<ThemeProvider {/* your next-themes config */}>
  <StackTheme>
    {/* children */}
  </StackTheme>
</ThemeProvider>
```

Note that Stack assumes the default `themes=['dark', 'light']` setting of next-themes. If you use a different set of themes, Stack might not work as expected.

### Using other theme providers

If you use a different theme provider that doesn't work with next-themes, you can pass in `colorMode` and `setColorMode` as props to the `StackTheme` and it will use those to handle color mode. (Note that you need to put the `StackTheme` in a client component in this case and import it to your `layout.tsx` file)

```jsx
import React, { useState } from 'react'

function CustomUIProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = {/** your own color mode state and setter */}

  return (
    <StackTheme theme={{ colorMode, setColorMode }}>
      {children}
    </StackTheme>
  )
}
```