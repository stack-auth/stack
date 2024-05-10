'use client';

import { ClientProjectJson } from "@stackframe/stack-shared";
import { useStackApp } from "../lib/hooks";
import OAuthButton from "./oauth-button";

export default function OAuthGroup({
  type,
  mockProject,
}: {
  type: 'signin' | 'signup',
  mockProject?: ClientProjectJson,
}) {
  const stackApp = useStackApp();
  const project = mockProject || stackApp.useProject();

  return (
    <div style={{ gap: '16px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {project.oauthProviders.filter(p => p.enabled).map(p => (
        <OAuthButton key={p.id} provider={p.id} type={type}/>
      ))}
    </div>
  );
}
