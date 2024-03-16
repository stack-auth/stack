import NextLink from "next/link";
import { FONT_FAMILY, FONT_SIZES, LINE_HEIGHTS } from "../utils/constants";
import { Url } from "url";
import { useDesign } from "..";

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
  const { colorMode } = useDesign();
  return (
    <NextLink
      href={href}
      style={{
        fontSize: FONT_SIZES[size],
        lineHeight: LINE_HEIGHTS[size],
        fontFamily: FONT_FAMILY,
        color: colorMode === 'dark' ? '#3B82F6' : '#2563EB',
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