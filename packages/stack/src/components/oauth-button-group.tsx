'use client';

import { useStackApp } from "../lib/hooks";
import { ClientProject } from "../lib/stack-app";
import { OAuthButton } from "./oauth-button";

export function OAuthButtonGroup({
  type,
  mockProject,
}: {
  type: 'sign-in' | 'sign-up',
  mockProject?: ClientProject,
}) {
  const stackApp = useStackApp();
  const project = mockProject || stackApp.useProject();

  return (
    <div className='gap-4 flex flex-col items-stretch stack-scope'>
      {project.config.oauthProviders.map(p => (
        <OAuthButton key={p.id} provider={p.id} type={type}/>
      ))}
    </div>
  );
}
