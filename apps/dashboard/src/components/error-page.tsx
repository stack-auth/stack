"use client";

import { Button, Typography } from "@stackframe/stack-ui";
import { Logo } from "@/components/logo";
import { useRouter } from "@/components/router";

export default function ErrorPage(props: {
  title: React.ReactNode;
  description?: React.ReactNode;
  secondaryDescription?: React.ReactNode;
  redirectUrl: string;
  redirectText: string;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-4">
      <main className="flex max-w-lg flex-col items-center gap-4 text-center">
        <Logo width={80} />

        <Typography type="h1">{props.title}</Typography>

        <Typography>{props.description}</Typography>

        <Button onClick={() => router.push(props.redirectUrl)}>{props.redirectText}</Button>

        {props.secondaryDescription && <Typography variant="secondary">{props.secondaryDescription}</Typography>}
      </main>
    </div>
  );
}
