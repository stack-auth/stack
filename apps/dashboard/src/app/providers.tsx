'use client';
import { useUser } from '@stackframe/stack';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { Suspense, useEffect, useState } from 'react';

if (typeof window !== 'undefined') {
  posthog.init("phc_vIUFi0HzHo7oV26OsaZbUASqxvs8qOmap1UBYAutU4k", {
    api_host: "/consume",
    ui_host: "https://eu.i.posthog.com",
    person_profiles: 'identified_only',
  });
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
        displayName: user.displayName,
      });
      setLastUserId(user.id);
    } else if (!user && lastUserId) {
      posthog.reset();
      setLastUserId(null);
    }
  }, [user, lastUserId]);
  return null;
}
