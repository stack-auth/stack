"use client";

import React, { use } from "react";
import { Box, Checkbox, Stack, Typography } from "@mui/joy";
import { typedIncludes } from "stack-shared/dist/utils/arrays";

const enumerationContext = React.createContext<{ type: EnumerationProps["type"] } | null>(null);

const olProps = ["numbered"] as const;
const ulProps = ["bulleted", "checklist"] as const;


type EnumerationProps = 
  & {
    type: typeof olProps[number] | typeof ulProps[number],
  }
  & (
    | React.ComponentProps<"ol">
    | React.ComponentProps<"ul">
  );

export function Enumeration(props: EnumerationProps) {
  const { type, ...listProps } = props;
  const Component = typedIncludes(olProps, type) ? "ol" : "ul";

  return (
    <enumerationContext.Provider value={{ type }}>
      <Component
        {...listProps as {}}
        style={{
          margin: 0,
          ...listProps.style,
        }}
      />
    </enumerationContext.Provider>
  );
}

type EnumerationItemProps = React.ComponentProps<"li"> & (
  | {
    type?: undefined,
    checked?: boolean,
  }
  | {
    type: "numbered" | "bulleted",
  }
  | {
    type: "checklist",
    checked?: boolean,
  }
);

export function EnumerationItem(props: EnumerationItemProps) {
  const enumeration = use(enumerationContext);

  let { type, checked, children, ...listItemProps } = props as EnumerationItemProps & { checked?: boolean };
  type ??= enumeration?.type;


  return (
    <Box
      display="list-item"
      component="li"
      {...listItemProps as {}}
      sx={{
        listStyleType: !type ? undefined : {
          bulleted: "disc",
          numbered: "decimal",
          checklist: "none",
        }[type],
      }}
    >
      {type !== "checklist" ? children : (
        <Stack
          direction="row"
          marginY="4px"
        >
          <Stack
            height="1lh"
            width="56px"
            marginLeft="-56px"
            justifyContent="center"
            alignItems="center"
          >
            <Checkbox
              readOnly
              checked={!!checked}
              sx={{
                paddingInlineStart: "16px",
                pointerEvents: "none",
              }}
            />
          </Stack>
          <Box>
            {children}
          </Box>
        </Stack>
      )}
    </Box>
  );
}
