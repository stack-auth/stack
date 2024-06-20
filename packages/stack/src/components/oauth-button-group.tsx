'use client';

import { ClientProjectJson } from "@stackframe/stack-shared";
import { useStackApp } from "../lib/hooks";
import { OAuthButton } from "./oauth-button";

export function OAuthButtonGroup({
  type,
  mockProject,
}: {
  type: 'sign-in' | 'sign-up',
  mockProject?: ClientProjectJson,
}) {
  const stackApp = useStackApp();
  const project = mockProject || stackApp.useProject();

  return (
    <div className='gap-4 flex flex-col items-stretch stack-scope'>
      {project.oauthProviders.filter(p => p.enabled).map(p => (
        <OAuthButton key={p.id} provider={p.id} type={type}/>
      ))}
    </div>
  );
}
