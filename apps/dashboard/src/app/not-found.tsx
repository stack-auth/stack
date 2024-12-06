"use client";

import ErrorPage from "@/components/error-page";
import { Link } from "@/components/link";

export default function NotFound() {
  return <ErrorPage
    title="Oh no! 404"
    description="Page not found."
    redirectUrl="/"
    secondaryDescription={<>
      Did you mean to <Link href="/handler/sign-in" className="underline">log in</Link>?
    </>}
    redirectText="Go home"
  />;
}
