"use client";

import { AccordionGroup, Card, CardOverflow } from "@mui/joy";
import { use, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { useStrictMemo } from "@stackframe/stack-shared/src/hooks/use-strict-memo";
import { SmartSwitch } from "@/components/smart-switch";
import { SimpleCard } from "@/components/simple-card";
import { useAdminApp } from "../../useAdminInterface";
import { ProviderAccordion, ProviderType, availableProviders } from "./provider-accordion";
import { OauthProviderConfigJson } from "@stackframe/stack-shared";

export default function ProvidersClient() {
  const stackAdminApp = useAdminApp();
  const [invalidationCounter, setInvalidationCounter] = useState(0);

  const projectPromise = useStrictMemo(async () => {
    return await stackAdminApp.getProject();
  }, [stackAdminApp, invalidationCounter]);
  const project = use(projectPromise);

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
                await stackAdminApp.updateProject({
                  config: {
                    credentialEnabled: event.target.checked,
                  },
                });
                setInvalidationCounter((counter) => counter + 1);
              }}
            >
              Enable password authentication
            </SmartSwitch>
          </Paragraph>
        </SimpleCard>
      </Paragraph>


      <SimpleCard title="Oauth">
        <Card variant="soft">
          <CardOverflow>
            <AccordionGroup sx={{ margin: "var(--AspectRatio-margin)" }}>
              {availableProviders.map((id) => {
                const provider = oauthProviders.find((provider) => provider.id === id);
                return <ProviderAccordion 
                  key={id} 
                  id={id} 
                  provider={provider}
                  updateProvider={async (provider?: OauthProviderConfigJson) => {
                    await stackAdminApp.updateProject({
                      config: {
                        oauthProviders: oauthProviders.map((p) => p.id === id ? provider : p).filter((p) => p) as OauthProviderConfigJson[],
                      },
                    });
                    setInvalidationCounter((counter) => counter + 1);
                  }}
                />;
              })}
            </AccordionGroup>
          </CardOverflow>
        </Card>

        <Paragraph sidenote>
          Add an Oauth provider to enable &quot;Sign in with XYZ&quot; on your app. You can enable multiple providers, and users will be able to sign in with any of them.
        </Paragraph>

        <Paragraph sidenote>
          In order to add a new provider, you can choose to use shared credentials created by us, or create your own Oauth client on the provider&apos;s website. Pick an Oauth-compatible service from the list below to get started.
        </Paragraph>
      </SimpleCard>
    </>
  );
}
