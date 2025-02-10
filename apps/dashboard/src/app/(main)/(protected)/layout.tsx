'use client';

import Loading from "@/app/loading";
import { getPublicEnvVar } from '@stackframe/stack-shared/dist/utils/env';
import { useStackApp, useUser } from "@stackframe/stack";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const app = useStackApp();
  const user = useUser();

  useEffect(() => {
    const signIn = async () => {
      if (getPublicEnvVar("NEXT_PUBLIC_STACK_EMULATOR_ENABLED") === "true" && !user) {
        await app.signInWithCredential({
          email: "local-emulator@email.com",
          password: "LocalEmulatorPassword123",
        });
      }
    };
    signIn().catch(console.error);
  }, [user, app]);

  if (getPublicEnvVar("NEXT_PUBLIC_STACK_EMULATOR_ENABLED") === "true" && !user) {
    return <Loading />;
  } else {
    return <>{children}</>;
  }
}
