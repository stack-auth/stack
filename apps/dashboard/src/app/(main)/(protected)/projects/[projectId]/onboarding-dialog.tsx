"use client";

import { useEffect, useState } from "react";
import { ApiKeyFirstView } from "@stackframe/stack";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { ActionDialog, InlineCode, Typography } from "@stackframe/stack-ui";
import EnvKeys from "@/components/env-keys";
import { StyledLink } from "@/components/link";
import { useAdminApp } from "./use-admin-app";

export function OnboardingDialog() {
  const stackAdminApp = useAdminApp();
  const apiKeySets = stackAdminApp.useApiKeys();
  const project = stackAdminApp.useProject();
  const [apiKey, setApiKey] = useState<ApiKeyFirstView | null>(null);

  useEffect(() => {
    runAsynchronously(async () => {
      if (apiKeySets.length > 0) {
        return;
      }

      // un-cancellable beyond this point
      const apiKey = await stackAdminApp.createApiKey({
        hasPublishableClientKey: true,
        hasSecretServerKey: true,
        hasSuperSecretAdminKey: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 200), // 200 years, effectively never
        description: "Automatically created during onboarding.",
      });
      setApiKey(apiKey);
    });
  }, [apiKeySets, stackAdminApp]);

  return (
    <ActionDialog
      title="Onboarding"
      okButton={{
        label: "Continue",
        onClick: async () => setApiKey(null),
      }}
      open={!!apiKey}
      onClose={() => setApiKey(null)}
    >
      <div className="flex flex-col gap-2">
        <Typography className="mb-4">
          Congratulations on creating your new project! We have automatically created an API key for you. Please copy it to your{" "}
          <InlineCode>.env.local</InlineCode> file. Get more information in the{" "}
          <StyledLink target="_blank" href="https://docs.stack-auth.com">
            getting started guide
          </StyledLink>
          .
        </Typography>
        <EnvKeys projectId={project.id} publishableClientKey={apiKey?.publishableClientKey} secretServerKey={apiKey?.secretServerKey} />
        <Typography type="label">
          Note that these keys will only be shown once. If you lose them, you can always generate a new one on the API Keys section of the
          dashboard.
        </Typography>
      </div>
    </ActionDialog>
  );
}
