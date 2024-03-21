import { useStackApp } from "../lib/hooks";
import OAuthButton from "./oauth-button";

export default function OAuthGroup({
  type,
}: {
  type: 'signin' | 'signup',
}) {
  const stackApp = useStackApp();
  const project = stackApp.useProject();

  return (
    <div style={{ gap: '16px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {project.oauthProviders.filter(p => p.enabled).map(p => (
        <OAuthButton key={p.id} provider={p.id} type={type}/>
      ))}
    </div>
  );
}
