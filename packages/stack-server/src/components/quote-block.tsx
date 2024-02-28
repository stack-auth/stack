import { Box, BoxProps } from "@mui/joy";

export function QuoteBlock(props: BoxProps<'blockquote'>) {
  return (
    <Box
      component="blockquote"
      {...props}
      sx={{
        borderLeft: '4px solid var(--joy-palette-neutral-outlinedBorder)',
        paddingLeft: 2,
        marginY: 0,
        paddingY: 0,
        marginLeft: 2,
        ...props.sx,
      }}
    />
  );
}
