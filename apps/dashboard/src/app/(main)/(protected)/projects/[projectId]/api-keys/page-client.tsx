"use client";

import { useState } from "react";
import * as yup from "yup";
import { ApiKeyFirstView } from "@stackframe/stack";
import { ActionDialog, Button, Typography } from "@stackframe/stack-ui";
import { ApiKeyTable } from "@/components/data-table/api-key-table";
import EnvKeys from "@/components/env-keys";
import { SmartFormDialog } from "@/components/form-dialog";
import { SelectField } from "@/components/form-fields";
import { PageLayout } from "../page-layout";
import { useAdminApp } from "../use-admin-app";

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const apiKeySets = stackAdminApp.useApiKeys();

  const [isNewApiKeyDialogOpen, setIsNewApiKeyDialogOpen] = useState(false);
  const [returnedApiKey, setReturnedApiKey] = useState<ApiKeyFirstView | null>(null);

  return (
    <PageLayout title="API Keys" actions={<Button onClick={() => setIsNewApiKeyDialogOpen(true)}>Create API Key</Button>}>
      <ApiKeyTable apiKeys={apiKeySets} />

      <CreateDialog open={isNewApiKeyDialogOpen} onOpenChange={setIsNewApiKeyDialogOpen} onKeyCreated={setReturnedApiKey} />
      <ShowKeyDialog apiKey={returnedApiKey || undefined} onClose={() => setReturnedApiKey(null)} />
    </PageLayout>
  );
}

const neverInMs = 1000 * 60 * 60 * 24 * 365 * 200;
const expiresInOptions = {
  [1000 * 60 * 60 * 24 * 1]: "1 day",
  [1000 * 60 * 60 * 24 * 7]: "7 days",
  [1000 * 60 * 60 * 24 * 30]: "30 days",
  [1000 * 60 * 60 * 24 * 90]: "90 days",
  [1000 * 60 * 60 * 24 * 365]: "1 year",
  [neverInMs]: "Never",
} as const;

const formSchema = yup.object({
  description: yup.string().required().label("Description"),
  expiresIn: yup
    .string()
    .default(neverInMs.toString())
    .label("Expires in")
    .meta({
      stackFormFieldRender: (props) => (
        <SelectField {...props} options={Object.entries(expiresInOptions).map(([value, label]) => ({ value, label }))} />
      ),
    }),
});

function CreateDialog(props: { open: boolean; onOpenChange: (open: boolean) => void; onKeyCreated?: (key: ApiKeyFirstView) => void }) {
  const stackAdminApp = useAdminApp();

  return (
    <SmartFormDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Create API Key"
      formSchema={formSchema}
      okButton={{ label: "Create" }}
      onSubmit={async (values) => {
        const expiresIn = parseInt(values.expiresIn);
        const newKey = await stackAdminApp.createApiKey({
          hasPublishableClientKey: true,
          hasSecretServerKey: true,
          hasSuperSecretAdminKey: false,
          expiresAt: new Date(Date.now() + expiresIn),
          description: values.description,
        });
        props.onKeyCreated?.(newKey);
      }}
      cancelButton
    />
  );
}

function ShowKeyDialog(props: { apiKey?: ApiKeyFirstView; onClose?: () => void }) {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProject();
  if (!props.apiKey) return null;

  return (
    <ActionDialog
      open={!!props.apiKey}
      title="API Key"
      okButton={{ label: "Close" }}
      onClose={props.onClose}
      confirmText="I understand that I will not be able to view this key again."
    >
      <div className="flex flex-col gap-4">
        <Typography>
          Here are your API keys. <span className="font-bold">Copy them to a safe place. You will not be able to view them again.</span>
        </Typography>
        <EnvKeys
          projectId={project.id}
          publishableClientKey={props.apiKey.publishableClientKey}
          secretServerKey={props.apiKey.secretServerKey}
        />
      </div>
    </ActionDialog>
  );
}
