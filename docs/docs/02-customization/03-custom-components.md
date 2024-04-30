---
sidebar_position: 1
---

# Custom Components

# Custom Components

Even though Stack provides beautiful components out of the box, sometimes you might want to achieve a coherent visual style across your entire website. Stack allows you to replace low-level components like buttons, inputs, and text with your own custom components, as long as the props are the same. The high-level components like sign-in, sign-up, or OAuth will automatically use the custom components. This is useful if you want to achieve deep customization.

We currently already implemented support for MUI Joy, so you can use it directly with minimal setup (see [MUI Joy](#mui-joy-setup)). Support for other common libraries like Chakra UI, Daisy UI, and Shadcn is coming soon. If you use libraries that are currently not supported or you have your own custom components, you can follow the customizing components guide below.

## Customizing Components

Here is an example of how you can customize the button component. For demonstration purposes, we will keep the styling minimal. We will create a new button component. You can use the `useDesign` hook to get the color scheme (see more in [Custom Colors](/docs/customization/custom-colors)). You can also ignore the color scheme if you have a different way to handle colors.

```jsx
'use client';

import React from "react";
import { Button as DefaultButton, useDesign } from "@stackframe/stack";

export const Button = React.forwardRef<
  React.ElementRef<typeof DefaultButton>,
  React.ComponentProps<typeof DefaultButton>
>(({
  variant = "primary",
  color,
  size = "md",
  loading = false,
  disabled = false,
  ...props
}, ref) => {
  const { colors } = useDesign();

  return <button
    style={{
      padding: ({ sm: 5, md: 10, lg: 15 } as const)[size],
      backgroundColor: color || ({
        primary: colors.light.primaryColor,
        secondary: colors.light.secondaryColor,
      } as const)[variant],
    }}
    disabled={loading || disabled}
    {...props}
  />;
});

Button.displayName = "Button";
```

Then you can pass the custom button to the `StackTheme` (if you followed the get started guide, you can find it in your `layout.tsx` file) as follows:

```jsx
//...
import CustomButton from "./your-custom-button-path";

const theme = {
  // other theme configs
  components: {
    Button: CustomButton,
  }
}

//...

<StackTheme theme={theme}>
  {/* children */}
</StackTheme>
```

Now if you check out your sign-in page, you will see the sign-in button there is using your custom button component. If you import `Button` from `@stackframe/stack`, it will also use your custom button component as well.

Here is a list of low-level components that you can customize, stared ones are the most used and recommended to customize first:

- `Input` ⭐
- `Button` ⭐
- `Container`
- `Separator`
- `Label`
- `Link`
- `Text` ⭐
- `Popover`, `PopoverTrigger`, `PopoverContent`
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`
- `Avatar`, `AvatarFallback`, `AvatarImage`
- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Skeleton`

## MUI Joy setup

If you use MUI Joy and want the Stack components to look consistent with MUI Joy, you can follow the following steps:

Replace `StackTheme` with `StackJoyTheme`, and put it inside your `CssVarsProvider` from Joy UI. Your `layout.tsx` file should look like this:
    ```jsx
    import React from "react";
    import { CssVarsProvider, getInitColorSchemeScript } from '@mui/joy/styles';
    import CssBaseline from '@mui/joy/CssBaseline';
    import { StackProvider } from "@stackframe/stack";
    import StackJoyTheme from "@stackframe/stack/joy";
    import Provider from "src/components/provider";
    import { stackServerApp } from "src/stack";


    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <html lang="en" suppressHydrationWarning>
          <head />
          <body>
            {getInitColorSchemeScript()}
            <StackProvider app={stackServerApp}>
              <CssVarsProvider defaultMode="system">
                <CssBaseline />
                <StackJoyTheme>
                  {props.children}
                </StackJoyTheme>
              </CssVarsProvider>
            </StackProvider>
          </body>
        </html>
      );
    }
    ```

    Now your Stack components will look consistent with MUI Joy. Note it is important that `StackJoyTheme` is inside `CssVarsProvider`. It uses the color mode from `CssVarsProvider` to automatically.

    If you need more information about MUI Joy setup, you can check out the [Joy UI Next.js integration docs](https://mui.com/joy/getting-started/installation/).
