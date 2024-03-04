import { Dialog } from "@/components/dialog";
import { use, useId, useRef, useState } from "react";
import { useStrictMemo } from "@stackframe/stack-shared/src/hooks/use-strict-memo";
import { useAdminApp } from "./useAdminInterface";
import { Box, Stack } from "@mui/joy";
import { Paragraph } from "@/components/paragraph";
import EnvKeys from "@/components/env-keys";
import { SmartLink } from "@/components/smart-link";
import { InlineCode } from "@/components/inline-code";

export function OnboardingDialog() {
  const called = useRef(false);
  const formId = useId();
  const stackAdminApp = useAdminApp();
  const [open, setOpen] = useState(true);

  const dataPromis = useStrictMemo(async () => {
    if (called.current) {
      return;
    }
    called.current = true;

    const apiKeySets = await stackAdminApp.listApiKeySets();
    if (apiKeySets.length > 0) {
      return;
    }

    setOpen(true);

    return await Promise.all([
      stackAdminApp.createApiKeySet({
        hasPublishableClientKey: true,
        hasSecretServerKey: true,
        hasSuperSecretAdminKey: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 200), // 200 years, effectively never
        description: 'Automatically created during onboarding.'
      }),
      stackAdminApp.getProject()
    ]);
  }, []);
  const data = use(dataPromis);
  console.log(data);
  if (!data) {
    return null;
  }

  const [apiKey, project] = data;

  return (
    <Dialog
      titleIcon="library_add"
      title="Onboarding"
      cancelButton
      okButton={{
        label: "Continue",
        onClick: async () => setOpen(false),
        props: {
          type: "submit",
          form: formId,
        },
      }}
      open={open}
      onClose={() => setOpen(false)}
    >
      {/* TODO: Add document link */}
      <Stack spacing={1}>
        <Paragraph body>
          Congratulations on creating your new project! We have automatically created an API key for you. Please copy it to your <InlineCode>.env.local</InlineCode> file; please see the  <SmartLink target="_blank" href={process.env.NEXT_PUBLIC_DOC_URL}>Getting Started guide</SmartLink>.
        </Paragraph>
        <EnvKeys projectId={project.id} publishableClientKey={apiKey.publishableClientKey} secretServerKey={apiKey.secretServerKey} />
        <Paragraph body>
          Note that these keys will only be shown right now, so copy them to a safe place. If you lose them, you can always generate a new one on the API Keys section of the dashboard.
        </Paragraph>
      </Stack>
    </Dialog>
  );
}
