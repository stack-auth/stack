'use client';

import NextLink from 'next/link';
import { cn } from "../../utils/shadcn";

type LinkProps = {
  href: string,
  children: React.ReactNode,
  className?: string,
  target?: string,
  onClick?: () => void,
  prefetch?: boolean,
};

export function Link(props: LinkProps) {
  return <NextLink
    href={props.href}
    target={props.target}
    className={props.className}
    prefetch={props.prefetch}
  >
    {props.children}
  </NextLink>;
}