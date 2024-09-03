"use client";

import NextLink from "next/link";
import { cn } from "../../lib/utils";

type LinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  prefetch?: boolean;
};

function Link(props: LinkProps) {
  return (
    <NextLink href={props.href} target={props.target} className={props.className} prefetch={props.prefetch} onClick={props.onClick}>
      {props.children}
    </NextLink>
  );
}

function StyledLink(props: LinkProps) {
  return (
    <Link {...props} className={cn("font-medium underline", props.className)}>
      {props.children}
    </Link>
  );
}

export { Link, StyledLink };
