'use client';
import { useUser } from '@stackframe/stack';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { Suspense, useEffect, useState } from 'react';

if (typeof window !== 'undefined') {
  const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "phc_vIUFi0HzHo7oV26OsaZbUASqxvs8qOmap1UBYAutU4k";
  if (postHogKey.length > 5) {
    posthog.init(postHogKey, {
      api_host: "/consume",
      ui_host: "https://eu.i.posthog.com",
    });
  }
}
export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

export function UserIdentity() {
  return <Suspense fallback={null}><UserIdentityInner /></Suspense>;
}

function UserIdentityInner() {
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const user = useUser();

  useEffect(() => {
    if (user && user.id !== lastUserId) {
      posthog.identify(user.id, {
        primaryEmail: user.primaryEmail,
        displayName: user.displayName ?? user.primaryEmail ?? user.id,
      });
      setLastUserId(user.id);
    } else if (!user && lastUserId) {
      posthog.reset();
      setLastUserId(null);
    }
  }, [user, lastUserId]);
  return null;
}
