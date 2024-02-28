import { Box, BoxProps } from "@mui/joy";
import { allMaterialSymbolShortStrings, type MaterialSymbolName } from "./material-symbol-names";

type PropsWithoutBase = {
  icon: MaterialSymbolName,
  fill?: boolean,
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700,
  grade?: -25 | 0 | 200,
  opticalSize?: number,
  size?: number | string,
};

export const Icon: {
  (props: PropsWithoutBase & Omit<BoxProps, keyof PropsWithoutBase | "children">): JSX.Element,
  allIcons: Set<MaterialSymbolName>,
} = (props: PropsWithoutBase & Omit<BoxProps, keyof PropsWithoutBase | "children">) => {
  let { icon, fill, weight, grade, opticalSize, size, ...boxProps } = props;
  if (typeof size === "number") {
    opticalSize ??= size;
    size = `${size}px`;
  }
  return (
    <Box
      display="inline-flex"
      component="span"
      color="var(--Icon-color) !important"
      margin="var(--Icon-margin) !important"
      fontSize="var(--Icon-fontSize, 20px) !important"
      width="1em !important"
      height="1em !important"
      {...boxProps}
      className={`material-symbols-rounded n2-icon ${boxProps.className ?? ""}`}
      sx={{
        "--Icon-fontSize": size ?? undefined,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight ?? 400}, 'GRAD' ${grade ?? 0}, 'opsz' ${opticalSize ?? 20}`,
        userSelect: 'none',
        ...boxProps.sx,
      }}
    >
      {allMaterialSymbolShortStrings[icon] ?? icon}
    </Box>
  );
};
Icon.allIcons = new Set(Object.keys(allMaterialSymbolShortStrings) as MaterialSymbolName[]);
