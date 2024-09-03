"use client";

import { useRouter } from "next/navigation";
import { useStackApp, useUser } from "@stackframe/stack";
import { Button, Link } from "@stackframe/stack-ui";

export default function PageClient() {
  const user = useUser();
  const router = useRouter();
  const app = useStackApp();

  const authButtons = (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="flex gap-5">
        <Button onClick={() => router.push(app.urls.signIn)}>Sign In</Button>
        <Button onClick={() => router.push("/handler/signup")}>Sign Up</Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-10">
      {user ? (
        <div className="flex flex-col items-center justify-center gap-5">
          <Link href={app.urls.signOut}>Sign Out</Link>
        </div>
      ) : (
        authButtons
      )}
    </div>
  );
}
