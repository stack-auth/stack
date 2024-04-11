"use client";

import { CssBaseline, CssVarsProvider, extendTheme, getInitColorSchemeScript, useColorScheme as useJoyColorScheme } from "@mui/joy";
import {
  experimental_extendTheme as materialExtendTheme,
  Experimental_CssVarsProvider as MaterialCssVarsProvider,
  THEME_ID as MATERIAL_THEME_ID,
} from "@mui/material/styles";
import { useColorScheme as useMaterialColorScheme } from "@mui/material";
import NextLink from "next/link";
import React from "react";

const materialTheme = materialExtendTheme({
  typography: {
    fontFamily: `var(--font-geist-sans, sans-serif)`,
  },
});

const theme = extendTheme({
  fontFamily: {
    body: `var(--font-geist-sans, sans-serif)`,
    code: `var(--font-geist-mono, ui-monospace)`,
    display: `var(--font-geist-sans, sans-serif)`,
  },
  typography: {
    h1: {
      fontWeight: "var(--joy-fontWeight-lg, 600)",
      fontSize: "2rem",
    },
    h2: {
      fontWeight: "var(--joy-fontWeight-lg, 600)",
      fontSize: "1.2rem",
    },
    h3: {
      fontWeight: "var(--joy-fontWeight-md, 500)",
      fontSize: "1.125rem",
    },
    h4: {
      fontWeight: "var(--joy-fontWeight-md, 500)",
      fontSize: "1rem",
    },
  },
  components: {
    JoyLink: {
      defaultProps: {
        // eslint-disable-next-line react/display-name
        component: React.forwardRef((props, ref) => (<NextLink {...props} ref={ref} prefetch={false} />)),
        ...{
          "data-n2-clickable": true,
        } as any,
      },
    },

    JoyButton: {
      defaultProps: {
        ...{
          "data-n2-clickable": true,
        } as any,
      },
    },

    JoyTooltip: {
      styleOverrides: {
        root: {
          // make sure the tooltip text wraps if it's long
          maxWidth: "250px",
        },
      },
    },

    JoyCard: {
      styleOverrides: {
        root: {
          // don't override font so the user still has to use Paragraph or Typography
          fontFamily: "inherit",
        },
      },
    },

    JoySheet: {
      styleOverrides: {
        root: {
          // don't override font so the user still has to use Paragraph or Typography
          fontFamily: "inherit",
        },
      },
    },
  },
});

export default function ThemeProvider(props: { children: React.ReactNode }) {
  const defaultMode = "system";

  return (
    <MaterialCssVarsProvider theme={{ [MATERIAL_THEME_ID]: materialTheme }} defaultMode={defaultMode}>
      <CssVarsProvider theme={theme} defaultMode={defaultMode}>
        <CssBaseline />
        <SyncMaterialWithJoy />
        {getInitColorSchemeScript({ defaultMode: "system" })}
        {props.children}
      </CssVarsProvider>
    </MaterialCssVarsProvider>
  );
}

function SyncMaterialWithJoy() {
  const colorScheme = useJoyColorScheme();
  const materialColorScheme = useMaterialColorScheme();
  React.useLayoutEffect(() => {
    if (colorScheme.mode !== materialColorScheme.mode) {
      materialColorScheme.setMode(colorScheme.mode ?? null);
    }
  }, [colorScheme, materialColorScheme]);

  return (
    <></>
  );
}
