'use client';

import NextLink from "next/link";
import { FONT_FAMILY, FONT_SIZES, LINE_HEIGHTS, LINK_COLORS } from "../utils/constants";
import { Url } from "url";
import { useDesign } from "..";
import React from "react";

type LinkProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  href: Url | string,
} & Omit<React.HTMLProps<HTMLLinkElement>, 'size' | 'href'>

export function Link({
  size='md',
  href,
  style,
  ...props
} : LinkProps) {
  const { colorMode } = useDesign();
  return (
    <NextLink
      href={href}
      style={{
        fontSize: FONT_SIZES[size],
        lineHeight: LINE_HEIGHTS[size],
        fontFamily: FONT_FAMILY,
        color: LINK_COLORS[colorMode],
        textDecoration: 'underline',
        margin: 0,
        padding: 0,
        ...style
      }}
    >
      {props.children}
    </NextLink>
  );
}