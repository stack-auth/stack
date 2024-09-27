'use client';

import { MockProject } from "../components-page/auth-page";
import { useStackApp } from "../lib/hooks";
import { OAuthButton } from "./oauth-button";

export function OAuthButtonGroup({
  type,
  mockProject,
}: {
  type: 'sign-in' | 'sign-up',
  mockProject?: MockProject,
}) {
  const stackApp = useStackApp();
  const project = mockProject || stackApp.useProject();
  return (
    <div className='gap-4 flex flex-col items-stretch stack-scope'>
      {project.config.enabledAuthMethodConfigs.map(p => (
        p.type === 'oauth' ? <OAuthButton
          key={(p as any).oauth_provider_config_id}
          provider={(p as any).oauth_provider_config_id}
          type={type}
        /> : null
      ))}
    </div>
  );
}
