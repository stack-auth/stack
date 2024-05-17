"use client";;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminApp } from "../use-admin-app";
import EnvKeys from "@/components/env-keys";
import { ApiKeySetFirstView } from "@stackframe/stack";
import { PageLayout } from "../page-layout";
import { ApiKeyTable } from "@/components/data-table/api-key-table";
import { FormDialog } from "@/components/form-dialog";
import { InputField, SelectField } from "@/components/form-fields";
import * as yup from "yup";
import { ActionDialog } from "@/components/action-dialog";
import Typography from "@/components/ui/typography";


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const apiKeySets = stackAdminApp.useApiKeySets();

  const [isNewApiKeyDialogOpen, setIsNewApiKeyDialogOpen] = useState(false);
  const [returnedApiKey, setReturnedApiKey] = useState<ApiKeySetFirstView | null>(null);

  return (
    <PageLayout 
      title="API Keys"
      description="Manage your project's API keys" 
      actions={
        <Button onClick={() => setIsNewApiKeyDialogOpen(true)}>
          Create API Key
        </Button>
      }
    >
      <ApiKeyTable apiKeys={apiKeySets} />

      <CreateDialog
        open={isNewApiKeyDialogOpen}
        onOpenChange={setIsNewApiKeyDialogOpen}
        onKeyCreated={setReturnedApiKey}
      />
      <ShowKeyDialog
        apiKey={returnedApiKey || undefined}
        onClose={() => setReturnedApiKey(null)}
      />

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
  description: yup.string().required(),
  expiresIn: yup.string().required(),
});

function CreateDialog(props: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onKeyCreated?: (key: ApiKeySetFirstView) => void,
}) {
  const stackAdminApp = useAdminApp();

  return <FormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Create API Key"
    formSchema={formSchema}
    defaultValues={{ expiresIn: neverInMs.toString() }}
    okButton={{ label: "Create" }}
    render={(form) => (
      <>
        <InputField control={form.control} label="Description" name="description" />
        <SelectField control={form.control} label="Expires in" name="expiresIn" options={Object.entries(expiresInOptions).map(([value, label]) => ({ value, label }))} />
      </>
    )}
    onSubmit={async (values) => {
      const expiresIn = parseInt(values.expiresIn);
      const newKey = await stackAdminApp.createApiKeySet({
        hasPublishableClientKey: true,
        hasSecretServerKey: true,
        hasSuperSecretAdminKey: false,
        expiresAt: new Date(Date.now() + expiresIn),
        description: values.description,
      });
      props.onKeyCreated?.(newKey);
    }}
    cancelButton
  />;
}

function ShowKeyDialog(props: {
  apiKey?: ApiKeySetFirstView,
  onClose?: () => void,
}) {
  if (!props.apiKey) return null;

  return <ActionDialog
    open={!!props.apiKey}
    title="API Key"
    okButton={{ label: "Close" }}
    onClose={props.onClose}
    confirmText="I understand that I will not be able to view this key again"
  >
    <div className="flex flex-col gap-4">
      <Typography>
        Here are your API keys. Copy them to a safe place. You will not be able to view them again.
      </Typography>
      <EnvKeys
        projectId="projectId"
        publishableClientKey={props.apiKey.publishableClientKey}
        secretServerKey={props.apiKey.secretServerKey}
      />
    </div>
  </ActionDialog>;
}