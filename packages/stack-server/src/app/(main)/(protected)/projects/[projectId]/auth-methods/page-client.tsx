"use client";

import { AccordionGroup, Card, CardOverflow } from "@mui/joy";
import { Paragraph } from "@/components/paragraph";
import { SmartSwitch } from "@/components/smart-switch";
import { SimpleCard } from "@/components/simple-card";
import { useAdminApp } from "../use-admin-app";
import { ProviderAccordion, availableProviders } from "./provider-accordion";
import { OAuthProviderConfigJson } from "@stackframe/stack-shared";
import { PageLayout } from "../page-layout";
import { SettingCard, SettingSwitch } from "@/components/settings";

export default function ProvidersClient() {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();
  const oauthProviders = project.evaluatedConfig.oauthProviders;

  return (
    <PageLayout title="Auth Methods" description="Configure how users can sign in to your app">
      <SettingCard title="Email Authentication" description="Email address based sign in.">
        <SettingSwitch
          label="Password Authentication"
          checked={project.evaluatedConfig.credentialEnabled}
          onCheckedChange={async (checked) => {
            await project.update({
              config: {
                credentialEnabled: checked,
              },
            });
          }}
        />
        <SettingSwitch
          label="Magic Link (email with login link)"
          checked={project.evaluatedConfig.magicLinkEnabled}
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
        <AccordionGroup sx={{ margin: "var(--AspectRatio-margin)" }}>
          {availableProviders.map((id) => {
            const provider = oauthProviders.find((provider) => provider.id === id);
            return <ProviderAccordion 
              key={id} 
              id={id} 
              provider={provider}
              updateProvider={async (provider: OAuthProviderConfigJson) => {
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
        </AccordionGroup>
      </SettingCard>
    </PageLayout>
  );
}
