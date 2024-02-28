"use client";

import { useIsHydrated } from "@/hooks/use-is-hydrated";

type StyleLinkProps = Omit<React.ComponentProps<"link">, "rel" | "as" | "defer"> & {
  defer?: boolean,
};

export function StyleLink(props: StyleLinkProps) {
  const { defer, onLoad, ...linkProps } = props;
  const isHydrated = useIsHydrated();

  if (defer) {
    return (
      <>
        {isHydrated ? (
          <link rel="stylesheet" fetchPriority="low" {...linkProps} />
        ) : (
          <meta />
        )}
        <noscript>
          <link rel="stylesheet" fetchPriority="low" {...linkProps} />
        </noscript>
      </>
    );
  } else {
    return (
      <link rel="stylesheet" {...linkProps} />
    );
  }
}
