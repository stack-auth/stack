'use client';

import { useRouter } from "./router";
import { cn } from "@/lib/utils";

export function Link(props: {
  href: string,
  children: React.ReactNode,
  className?: string,
  target?: '_blank' | '_self',
  onClick?: () => void,
}) {
  const router = useRouter();

  return (
    <span 
      className={cn("cursor-pointer", props.className)}
      onClick={() => {
        if (props.target === "_blank") {
          window.open(props.href, "_blank");
        } else {
          router.push(props.href);
        }
      }}>
      {props.children}
    </span>
  );
}

export function StyledLink(props: {
  href: string,
  children: React.ReactNode,
  className?: string,
  target?: '_blank' | '_self',
  onClick?: () => void,
}) {
  return (
    <Link href={props.href} className={cn("text-blue-500 underline", props.className)} target={props.target} onClick={props.onClick}>
      {props.children}
    </Link>
  );
}