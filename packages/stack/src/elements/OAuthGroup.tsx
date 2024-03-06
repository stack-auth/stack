import { useStackApp } from "..";
import OAuthButton from "./OAuthButton";

export default function OAuthGroup({
  type,
  redirectUrl
}: {
  type: 'signin' | 'signup',
  redirectUrl?: string,
}) {
  const stackApp = useStackApp();
  const project = stackApp.useProject();

  return (
    <div className="wl_space-y-4 wl_flex wl_flex-col wl_items-stretch">
      {project.oauthProviders.filter(p => p.enabled).map(p => (
        <OAuthButton key={p.id} provider={p.id} type={type} redirectUrl={redirectUrl} />
      ))}
    </div>
  );
}
