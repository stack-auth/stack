import { Dialog } from "@/components/dialog";
import { use, useId, useRef, useState } from "react";
import { useStrictMemo } from "stack-shared/src/hooks/use-strict-memo";
import { useAdminApp } from "./useAdminInterface";
import { Stack } from "@mui/joy";
import { Paragraph } from "@/components/paragraph";
import Link from "next/link";

export function OnboardingDialog() {
  return null; // TODO: Enable after fixing the "root exit" issue
  const formId = useId();
  const stackAdminApp = useAdminApp();
  const [open, setOpen] = useState(false);

  const projectPromise = useStrictMemo(() => {
    return stackAdminApp.getProject();
  }, []);
  const project = use(projectPromise);

  const apiKeyPromise = useStrictMemo(async () => {
    const apiKeySets = await stackAdminApp.listApiKeySets();
    if (apiKeySets.length > 0) {
      return;
    }

    setOpen(true);

    return await stackAdminApp.createApiKeySet({
      hasPublishableClientKey: true,
      hasSecretServerKey: true,
      hasSuperSecretAdminKey: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 200), // 200 years, effectively never
      description: 'Onboarding'
    });
  }, []);
  const apiKey = use(apiKeyPromise);

  if (!apiKey || !project) {
    return null;
  }

  return (
    <Dialog
      titleIcon="library_add"
      title="Create new project"
      cancelButton
      okButton={{
        label: "Create",
        onClick: async () => "prevent-close",
        props: {
          type: "submit",
          form: formId,
        },
      }}
      open={open}
      onClose={() => setOpen(false)}
    >
      {/* TODO: Add document link */}
      <Stack spacing={2}>
        <Paragraph body>
          Here are your new API keys. Please copy this to your .env.local file. Detailed instruction can be founder <Link href="/docs/getting-started">here</Link>. 
        </Paragraph>
        <Paragraph body>
          NEXT_PUBLIC_STACK_PROJECT_ID={project.id}
          NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY={apiKey.publishableClientKey}
          STACK_SECRET_SERVER_KEY={apiKey.secretServerKey}
        </Paragraph>
      </Stack>
    </Dialog>
  );
}