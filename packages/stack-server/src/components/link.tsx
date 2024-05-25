'use client';

// eslint-disable-next-line
import NextLink from 'next/link';
import { confirmAlertMessage, useRouter, useRouterConfirm } from "./router";
import { cn } from "@/lib/utils";

export function Link(props: {
  href: string,
  children: React.ReactNode,
  className?: string,
  target?: string,
  onClick?: () => void,
}) {
  const router = useRouter();
  const { needConfirm } = useRouterConfirm();

  return <NextLink
    href={props.href}
    target={props.target}
    className={props.className}
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

export function StyledLink(props: {
  href: string,
  children: React.ReactNode,
  className?: string,
  target?: string,
  onClick?: () => void,
}) {
  return (
    <Link href={props.href} className={cn("text-blue-500 underline", props.className)} target={props.target} onClick={props.onClick}>
      {props.children}
    </Link>
  );
}