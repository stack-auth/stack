import { useStackApp } from "..";
import OauthButton from "./OauthButton";

export default function OauthGroup({
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
        <OauthButton key={p.id} provider={p.id} type={type} redirectUrl={redirectUrl} />
      ))}
    </div>
  );
}
