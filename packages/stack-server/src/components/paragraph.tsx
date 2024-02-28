import { Box, Typography, TypographyProps } from "@mui/joy";
import { SmartLink } from "./smart-link";
import { Icon } from "./icon";

const typeInfo = {
  box: {
    style: {},
    component: Box,
    level: undefined,
  },
  body: {
    style: {
      marginY: 1,
    },
    component: Box,
    level: undefined,
  },
  sidenote: {
    style: {
      marginY: 1,
    },
    component: Box,
    level: "body-xs",
  },
  h1: {
    style: {
      marginY: 1,
    },
    component: 'h1',
    level: 'h1',
  },
  h2: {
    style: {
      marginY: 1,
    },
    component: 'h2',
    level: 'h2',
  },
  h3: {
    style: {
      marginY: 1,
    },
    component: 'h3',
    level: 'h3',
  },
  h4: {
    style: {
      marginY: 1,
    },
    component: 'h4',
    level: 'h4',
  },
} as const;
type AllowedTypes = keyof typeof typeInfo;
const allowedTypes = Object.keys(typeInfo) as AllowedTypes[];

type OnlyAllowedType<T extends AllowedTypes> =
  & { [key in Exclude<AllowedTypes, T>]?: false }
  & { [key in T]: true };
type ParagraphProps = {
  [key in AllowedTypes]:
    & OnlyAllowedType<key>
    & Omit<TypographyProps<typeof typeInfo[key]["component"]>, keyof OnlyAllowedType<key>>
}[AllowedTypes];

export function Paragraph(props: ParagraphProps) {
  const level = allowedTypes.find((type) => props[type]);
  if (!level) throw new Error("Invalid paragraph type");

  const {children, ...typographyProps} = Object.fromEntries(Object.entries(props).filter(([k]) => !(k in typeInfo)));

  return (
    <Typography
      component={typeInfo[level].component}
      level={typeInfo[level].level}
      display="block"
      {...typographyProps}
      sx={{
        overflowX: 'auto',
        ...typeInfo[level].style,
        ...typographyProps.sx,
      }}
    >
      <Typography
        display="inline"
        component="span"
        sx={{
          "& > .MuiTypography-endDecorator": {
            display: 'none',
          },
          "&:hover > .MuiTypography-endDecorator": {
            display: 'inline',
          },
        }}
        endDecorator={level.startsWith('h') && typographyProps.id ? (
          <SmartLink
            href={`#${typographyProps.id}`}
            alignSelf="end"
            sx={{
              color: 'text.tertiary',
              fontWeight: 'normal',
              textUnderlineOffset: '0',
              ':hover': {
                color: 'text.primary',
              },
            }}
          >
            <Icon icon="link" sx={{ verticalAlign: "bottom" }} />
          </SmartLink>
        ) : undefined}
      >
        {children}
      </Typography>
    </Typography>
  );
}
