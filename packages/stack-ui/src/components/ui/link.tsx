'use client';

import NextLink from 'next/link';
import { cn } from "../../lib/utils";

type LinkProps = {
  href: string,
  children: React.ReactNode,
  className?: string,
  target?: string,
  onClick?: () => void,
  prefetch?: boolean,
};

function Link(props: LinkProps) {
  return <NextLink
    href={props.href}
    target={props.target}
    className={props.className}
    prefetch={props.prefetch}
  >
    {props.children}
  </NextLink>;
}

function StyledLink(props: LinkProps) {
  return (
    <Link {...props} className={cn("underline font-medium", props.className)}>
      {props.children}
    </Link>
  );
}

export { Link, StyledLink };