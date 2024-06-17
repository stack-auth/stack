'use client';
import { useUser } from '@stackframe/stack';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { Suspense, useEffect, useState } from 'react';

if (typeof window !== 'undefined') {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
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