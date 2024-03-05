"use client";

import { AccordionGroup, Card, CardOverflow } from "@mui/joy";
import { use, useState } from "react";
import { Paragraph } from "@/components/paragraph";
import { useStrictMemo } from "@stackframe/stack-shared/src/hooks/use-strict-memo";
import { SmartSwitch } from "@/components/smart-switch";
import { SimpleCard } from "@/components/simple-card";
import { useAdminApp } from "../../useAdminInterface";
import { ProviderAccordion, CreationType, allCreationTypes, getCreationType } from "../urls-and-callbacks/provider-accordion";

export default function ProvidersClient() {
  const stackAdminApp = useAdminApp();
  const [invalidationCounter, setInvalidationCounter] = useState(0);

  const projectPromise = useStrictMemo(async () => {
    return await stackAdminApp.getProject();
  }, [stackAdminApp, invalidationCounter]);
  const project = use(projectPromise);

  const oauthProviders = project.evaluatedConfig.oauthProviders;

  const availableProviderCreationTypes: CreationType[] = allCreationTypes
    .filter((creationType) => {
      return !oauthProviders.some((provider) => getCreationType(provider) === creationType);
    });

  return (
    <>
      <Paragraph h1>
        Auth Providers
      </Paragraph>

      <Paragraph body>
        <SimpleCard title="Password authentication">
          <Paragraph body>
            <SmartSwitch
              checked={project.evaluatedConfig.enableCredential}
              onChange={async (event) => {
                await stackAdminApp.updateProject({
                  config: {
                    enableCredential: event.target.checked,
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
        <Paragraph h3>
          Enabled providers
        </Paragraph>

        <Card variant="soft">
          <CardOverflow>
            {oauthProviders.length === 0 ? (
              <Paragraph sidenote sx={{ textAlign: "center" }} color="danger">
              No auth providers enabled yet. Add one from the available providers below!
              </Paragraph>
            ) : (
              <AccordionGroup sx={{ margin: "var(--AspectRatio-margin)" }}>
                {oauthProviders.map((provider) => (
                  <ProviderAccordion key={provider.id} provider={provider} />
                ))}
              </AccordionGroup>
            )}
          </CardOverflow>
        </Card>

        <Paragraph sidenote>
          Add an Oauth provider to enable &quot;Sign in with XYZ&quot; on your app. You can enable multiple providers, and users will be able to sign in with any of them.
        </Paragraph>

        <Paragraph sidenote>
          In order to add a new provider, you can choose to use shared credentials created by us, or create your own Oauth client on the provider&apos;s website. Pick an Oauth-compatible service from the list below to get started.
        </Paragraph>

        <Paragraph h3>
          Available providers
        </Paragraph>

        <Card variant="soft">
          <CardOverflow>
            {availableProviderCreationTypes.length === 0 ? (
              <Paragraph sidenote sx={{ textAlign: "center" }} color="danger">
                You&apos;ve already enabled all available Oauth providers. Carry on!
              </Paragraph>
            ) : (
              <AccordionGroup sx={{ margin: "var(--AspectRatio-margin)" }}>
                {availableProviderCreationTypes.map((creationType) => (
                  <ProviderAccordion
                    key={creationType}
                    createType={creationType}
                  />
                ))}
              </AccordionGroup>
            )}
          </CardOverflow>
        </Card>
      </SimpleCard>
    </>
  );
}
