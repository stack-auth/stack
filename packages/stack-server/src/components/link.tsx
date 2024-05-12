import NextLink from "next/link";

export function Link(props: {
  href: string,
  children: React.ReactNode,
  className?: string,
}) {
  return (
    <NextLink href={props.href} className="text-blue-500 underline">
      {props.children}
    </NextLink>
  );
}