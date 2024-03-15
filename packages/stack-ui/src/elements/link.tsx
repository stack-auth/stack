import NextLink from "next/link";
import { FONT_FAMILY, FONT_SIZES } from "../utils/constants";
import { Url } from "url";

export type LinkProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  href: Url | string,
} & Omit<React.HTMLProps<HTMLLinkElement>, 'size' | 'href'>

export default function Link({
  size='md',
  href,
  style,
  ...props
} : LinkProps) {
  return (
    <NextLink
      href={href}
      style={{
        fontSize: FONT_SIZES[size],
        fontFamily: FONT_FAMILY,
        padding: 0,
        margin: 0,
        ...style
      }}
    >
      {props.children}
    </NextLink>
  );
}