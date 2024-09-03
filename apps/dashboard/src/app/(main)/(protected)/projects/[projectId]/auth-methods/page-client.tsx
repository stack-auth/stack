"use client";

import { allProviders } from "@stackframe/stack-shared/dist/utils/oauth";
import { CardSubtitle } from "@stackframe/stack-ui";
import { SettingCard, SettingSwitch } from "@/components/settings";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";
import { ProviderSettingSwitch } from "./providers";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();
  const oauthProviders = project.config.oauthProviders;

  return (
    <PageLayout title="Auth Methods" description="Configure how users can sign in to your app">
      <SettingCard>
        <CardSubtitle>Email-based</CardSubtitle>
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
        <CardSubtitle className="mt-2">SSO (OAuth)</CardSubtitle>
        {allProviders.map((id) => {
          const provider = oauthProviders.find((provider) => provider.id === id);
          return (
            <ProviderSettingSwitch
              key={id}
              id={id}
              provider={provider}
              updateProvider={async (provider) => {
                const alreadyExist = oauthProviders.some((p) => p.id === id);
                const newOAuthProviders = oauthProviders.map((p) => (p.id === id ? provider : p));
                if (!alreadyExist) {
                  newOAuthProviders.push(provider);
                }
                await project.update({
                  config: { oauthProviders: newOAuthProviders },
                });
              }}
            />
          );
        })}
      </SettingCard>
      <SettingCard title="Settings">
        <SettingSwitch
          label="Disable sign ups, only allow sign ins from existing users"
          checked={!project.config.signUpEnabled}
          onCheckedChange={async (checked) => {
            await project.update({
              config: {
                signUpEnabled: !checked,
              },
            });
          }}
          hint="Admins (like you) can still create new accounts manually by clicking 'Create User' on the Users page of the dashboard."
        />
      </SettingCard>
    </PageLayout>
  );
}
