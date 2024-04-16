"use client";

import { Dialog } from "@/components/dialog";
import { useEffect, useState } from "react";
import { useAdminApp } from "./use-admin-app";
import { Stack } from "@mui/joy";
import { Paragraph } from "@/components/paragraph";
import EnvKeys from "@/components/env-keys";
import { SmartLink } from "@/components/smart-link";
import { InlineCode } from "@/components/inline-code";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { ApiKeySetFirstView } from "@stackframe/stack";

export function OnboardingDialog() {
  const stackAdminApp = useAdminApp();
  const apiKeySets = stackAdminApp.useApiKeySets();
  const project = stackAdminApp.useProject();
  const [apiKey, setApiKey] = useState<ApiKeySetFirstView | null>(null);

  useEffect(() => {
    runAsynchronously(async () => {
      if (apiKeySets.length > 0) {
        return;
      }

      // uncancellable beyond this point
      const apiKey = await stackAdminApp.createApiKeySet({
        hasPublishableClientKey: true,
        hasSecretServerKey: true,
        hasSuperSecretAdminKey: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 200), // 200 years, effectively never
        description: 'Automatically created during onboarding.'
      });
      setApiKey(apiKey);
    });
  }, [apiKeySets, stackAdminApp]);

  return (
    <Dialog
      titleIcon="library_add"
      title="Onboarding"
      okButton={{
        label: "Continue",
        onClick: async () => setApiKey(null),
      }}
      open={!!apiKey}
      onClose={() => setApiKey(null)}
    >
      {/* TODO: Add document link */}
      <Stack spacing={1}>
        <Paragraph body>
          Congratulations on creating your new project! We have automatically created an API key for you. Please copy it to your <InlineCode>.env.local</InlineCode> file; please see the  <SmartLink target="_blank" href={process.env.NEXT_PUBLIC_DOC_URL}>Getting Started guide</SmartLink>.
        </Paragraph>
        <EnvKeys projectId={project.id} publishableClientKey={apiKey?.publishableClientKey} secretServerKey={apiKey?.secretServerKey} />
        <Paragraph body>
          Note that these keys will only be shown right now, so copy them to a safe place. If you lose them, you can always generate a new one on the API Keys section of the dashboard.
        </Paragraph>
      </Stack>
    </Dialog>
  );
}
