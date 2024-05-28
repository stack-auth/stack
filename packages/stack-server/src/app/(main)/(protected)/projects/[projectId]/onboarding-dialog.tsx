"use client";
import { ActionDialog } from "@/components/action-dialog";
import { useEffect, useState } from "react";
import { useAdminApp } from "./use-admin-app";
import EnvKeys from "@/components/env-keys";
import { InlineCode } from "@/components/ui/inline-code";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { ApiKeySetFirstView } from "@stackframe/stack";
import Typography from "@/components/ui/typography";
import { StyledLink } from "@/components/link";

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
          Congratulations on creating your new project! We have automatically created an API key for you. Please copy it to your <InlineCode>.env.local</InlineCode> file. Get more information in the <StyledLink target="_blank" href={process.env.NEXT_PUBLIC_DOC_URL || ""}>getting started guide</StyledLink>.
        </Typography>
        <EnvKeys projectId={project.id} publishableClientKey={apiKey?.publishableClientKey} secretServerKey={apiKey?.secretServerKey} />
        <Typography type="label">
          Note that these keys will only be shown once. If you lose them, you can always generate a new one on the API Keys section of the dashboard.
        </Typography>
      </div>
    </ActionDialog>
  );
}
