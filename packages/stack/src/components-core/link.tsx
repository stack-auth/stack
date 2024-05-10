'use client';

import NextLink from "next/link";
import { FONT_FAMILY, FONT_SIZES, LINE_HEIGHTS, LINK_COLORS } from "../utils/constants";
import { Url } from "url";
import React from "react";
import styled from "styled-components";

type LinkProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  href: Url | string,
} & Omit<React.HTMLProps<HTMLLinkElement>, 'size' | 'href'>

const StyledNextLink = styled(NextLink)<{ 
  $size: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
}>`
  font-size: ${props => FONT_SIZES[props.$size]};
  line-height: ${props => LINE_HEIGHTS[props.$size]};
  font-weight: 500;
  font-family: ${FONT_FAMILY};
  text-decoration: underline;
  margin: 0;
  padding: 0;

  color: ${LINK_COLORS.light};

  html[data-stack-theme='dark'] & {
    color: ${LINK_COLORS.dark};
  }
`;

export const Link = React.forwardRef<
  React.ElementRef<typeof StyledNextLink>,
  LinkProps
>(({ size='md', href, ...props }, ref) => {
  return (
    <StyledNextLink
      $size={size}
      href={href}
      style={props.style}
      children={props.children}
    />
  );
});