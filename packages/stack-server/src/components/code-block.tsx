import { Box } from "@mui/joy";
import { Code } from "bright";
import { typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { CopyButton } from "./copy-button";

type CodeBlockProps = Omit<React.ComponentProps<typeof Box>, "children"> & {
  code?: string,
  language?: string,
  lineNumbers?: boolean,
  theme?: "auto" | "dark" | "light" | "inverted",
  codeProps?: React.ComponentProps<typeof Code>,
  disableBorder?: boolean,
};

export function CodeBlock(props: CodeBlockProps) {
  const {code, language, codeProps, lineNumbers, theme = "auto", disableBorder, ...boxProps} = props;

  let additionalCodeProps: React.ComponentProps<typeof Code> = {};
  additionalCodeProps.lang = language ?? "";
  additionalCodeProps.code = code ?? "";

  const themeObject = {
    dark: theme === "inverted" ? "light-plus" : "dracula", 
    light: theme === "inverted" ? "dracula" : "light-plus",
    lightSelector: `[data-joy-color-scheme="light"]`,
  } as const;
  const themeVar =
    typedIncludes(["dark", "light"] as const, theme)
      ? themeObject[theme]
      : themeObject;

  return (
    <Box
      {...boxProps}
      sx={{
        fontSize: '13px',
        position: 'relative',
        "& code": {
          WebkitFontSmoothing: 'subpixel-antialiased',
          textRendering: 'optimizeLegibility',
          fontFamily: 'var(--joy-fontFamily-code)',
          letterSpacing: 0,
        },
        "& span[data-bright-ln]": {
          userSelect: 'none',
        },
      }}
    >
      <Code
        lineNumbers={lineNumbers}
        theme={themeVar}
        {...additionalCodeProps}
        {...codeProps}
        style={{
          border: disableBorder ? 'none' : '1px solid var(--joy-palette-neutral-outlinedBorder)',
          borderRadius: disableBorder ? 0 : '12px',
          margin: 0,
          ...(codeProps?.style ?? {}),
        }}
      />
      <CopyButton
        content={codeProps?.code ?? additionalCodeProps.code ?? ''}
        size="sm"
        sx={{
          position: 'absolute',
          top: '8px',
          right: '8px',
        }}
      />
    </Box>
  );
}
