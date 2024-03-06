"use client";

import { AccordionGroup, Card, CardOverflow } from "@mui/joy";
import { Paragraph } from "@/components/paragraph";
import { SmartSwitch } from "@/components/smart-switch";
import { SimpleCard } from "@/components/simple-card";
import { useAdminApp } from "../../use-admin-app";
import { ProviderAccordion, availableProviders } from "./provider-accordion";
import { OAuthProviderConfigJson } from "@stackframe/stack-shared";

export default function ProvidersClient() {
  const stackAdminApp = useAdminApp();

  const project = stackAdminApp.useProjectAdmin();

  const oauthProviders = project.evaluatedConfig.oauthProviders;

  return (
    <>
      <Paragraph h1>
        Auth Providers
      </Paragraph>

      <Paragraph body>
        <SimpleCard title="Password authentication">
          <Paragraph body>
            <SmartSwitch
              checked={project.evaluatedConfig.credentialEnabled}
              onChange={async (event) => {
                await project.update({
                  config: {
                    credentialEnabled: event.target.checked,
                  },
                });
              }}
            >
              Enable password authentication
            </SmartSwitch>
          </Paragraph>
        </SimpleCard>
      </Paragraph>


      <SimpleCard title="OAuth">
        <Card variant="soft">
          <CardOverflow>
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
          </CardOverflow>
        </Card>

        <Paragraph sidenote>
          Add an OAuth provider to enable &quot;Sign in with XYZ&quot; on your app. You can enable multiple providers, and users will be able to sign in with any of them.
        </Paragraph>

        <Paragraph sidenote>
          In order to add a new provider, you can choose to use shared credentials created by us, or create your own OAuth client on the provider&apos;s website. Pick an OAuth-compatible service from the list below to get started.
        </Paragraph>
      </SimpleCard>
    </>
  );
}
