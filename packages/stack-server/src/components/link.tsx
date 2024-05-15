import NextLink from "next/link";

export function Link(props: {
  href: string,
  children: React.ReactNode,
  className?: string,
  target?: string,
}) {
  return (
    <NextLink href={props.href} className="text-blue-500 underline" target={props.target}>
      {props.children}
    </NextLink>
  );
}