---
sidebar_position: 1
title: Colors & Color Mode
---

# Colors and Color Mode

## Color Palette

If you want to spend minimal time on styling but still want to align with your brand, you can customize the colors of the Stack app. Colors are stored in React context and can be easily overridden.

There are a few variables that you can override:

- `primaryColor`: The primary color used for components like button with primary variant.
- `secondaryColor`: The secondary color used for components like button with secondary variant.
- `neutralColor`: The color used for separators and borders.
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

## Color Mode

Stack components support light and dark mode out of the box. You can switch between light and dark mode using [next-themes](https://github.com/pacocoursey/next-themes) (or any other library that changes the `data-theme` attribute of the `html` element).

Here is an example of how to set up next-themes with Stack (find more details in the [next-themes documentation](https://github.com/pacocoursey/next-themes)):

1. Install next-themes:

  ```bash
  npm install next-themes
  ```

2. Add the `ThemeProvider` to your `layout.tsx` file:

  ```jsx
  import { ThemeProvider } from 'next-themes'

  export default function Layout({ children }) {
    return (
      <ThemeProvider>
        <StackTheme>
          {children}
        </StackTheme>
      </ThemeProvider>
    )
  }
  ```

3. Build a color mode switcher component:

  ```jsx
  'use client';
  import { Button } from '@stackframe/stack'
  import { useTheme } from 'next-themes'

  export default function ColorModeSwitcher() {
    const { theme, setTheme } = useTheme()
    return (
      <Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle theme
      </Button>
    )
  }
  ```

Now if you put the `ColorModeSwitcher` component in your app, you should be able to switch between light and dark mode. There should be no flickering or re-rendering of the page after reloading.
