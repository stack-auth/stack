import { Suspense } from "react";

export function SimpleSuspense(props: React.PropsWithChildren<{}>) {
  return (
    <>
      Suspense{"<"}<Suspense fallback={<span>Loading...</span>}>
        {props.children}
      </Suspense>{">"}
    </>
  );
}
