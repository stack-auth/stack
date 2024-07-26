"use client";
import { SettingCard, SettingSwitch } from "@/components/settings";
import { allProviders } from "@stackframe/stack-shared/dist/interface/crud/oauth";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";
import { ProviderSettingSwitch } from "./providers";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();
  const oauthProviders = project.config.oauthProviders;

  return (
    <PageLayout title="Auth Methods" description="Configure how users can sign in to your app">
      <SettingCard title="Email Authentication" description="Email address based sign in.">
        <SettingSwitch
          label="Email password authentication"
          checked={project.config.credentialEnabled}
          onCheckedChange={async (checked) => {
            await project.update({
              config: {
                credentialEnabled: checked,
              },
            });
          }}
        />
        <SettingSwitch
          label="Magic link (email with login link)"
          checked={project.config.magicLinkEnabled}
          onCheckedChange={async (checked) => {
            await project.update({
              config: {
                magicLinkEnabled: checked,
              },
            });
          }}
        />
      </SettingCard>

      <SettingCard title="OAuth Providers" description={`The "Sign in with XYZ" buttons on your app.`}>
        {allProviders.map((id) => {
          const provider = oauthProviders.find((provider) => provider.id === id);
          return <ProviderSettingSwitch
            key={id}
            id={id}
            provider={provider}
            updateProvider={async (provider) => {
              const alreadyExist = oauthProviders.some((p) => p.id === id);
              const newOAuthProviders = oauthProviders.map((p) => p.id === id ? provider : p);
              if (!alreadyExist) {
                newOAuthProviders.push(provider);
              }
              await project.update({
                config: { oauthProviders: newOAuthProviders },
              });
            }}
          />;
        })}
      </SettingCard>
    </PageLayout>
  );
}
