'use client';

// eslint-disable-next-line
import NextLink from 'next/link';
import { confirmAlertMessage, useRouter, useRouterConfirm } from "./router";
import { cn } from "../utils";

type LinkProps = {
  href: string,
  children: React.ReactNode,
  className?: string,
  target?: string,
  onClick?: () => void,
  prefetch?: boolean,
};

export function Link(props: LinkProps) {
  const router = useRouter();
  const { needConfirm } = useRouterConfirm();

  return <NextLink
    href={props.href}
    target={props.target}
    className={props.className}
    prefetch={props.prefetch}
    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
      if (needConfirm) {
        e.preventDefault();
        props.onClick?.();
        router.push(props.href);
      }
      props.onClick?.();
    }}
  >
    {props.children}
  </NextLink>;
    
}

export function StyledLink(props: LinkProps) {
  return (
    <Link {...props} className={cn("text-blue-500 underline", props.className)}>
      {props.children}
    </Link>
  );
}
