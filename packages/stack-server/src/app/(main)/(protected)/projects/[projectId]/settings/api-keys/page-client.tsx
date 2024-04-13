"use client";

import { useId, useState } from "react";
import { Box, Button, Checkbox, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormLabel, Input, Modal, ModalDialog, Select, Option, Stack, FormHelperText, Typography } from "@mui/joy";
import { AsyncButton } from "@/components/async-button";
import { Icon } from "@/components/icon";
import { Paragraph } from "@/components/paragraph";
import { ApiKeysTable } from "./api-keys-table";
import { useAdminApp } from "../../use-admin-app";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import EnvKeys from "@/components/env-keys";
import { SmartLink } from "@/components/smart-link";
import { ApiKeySetFirstView } from "@stackframe/stack/dist/lib/stack-app";


export default function ApiKeysDashboardClient() {
  const stackAdminApp = useAdminApp();
  const apiKeySets = stackAdminApp.useApiKeySets();

  const [isNewApiKeyDialogOpen, setIsNewApiKeyDialogOpen] = useState(false);

  return (
    <>
      <Paragraph h1>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
          API Keys
          </Box>
          <Button onClick={() => setIsNewApiKeyDialogOpen(true)}>
            Create new
          </Button>
        </Stack>
      </Paragraph>
        
      <Paragraph body>
        Please note that API keys cannot be viewed anymore after they have been created. If you lose them, you will have to create new ones.
      </Paragraph>

      <ApiKeysTable rows={apiKeySets} />

      <CreateNewDialog
        key={`${isNewApiKeyDialogOpen}`}
        open={isNewApiKeyDialogOpen}
        onClose={() => setIsNewApiKeyDialogOpen(false)}
      />
    </>
  );
}

const expiresInOptions = {
  [1000 * 60 * 60 * 24 * 1]: "1 day",
  [1000 * 60 * 60 * 24 * 7]: "7 days",
  [1000 * 60 * 60 * 24 * 30]: "30 days",
  [1000 * 60 * 60 * 24 * 90]: "90 days",
  [1000 * 60 * 60 * 24 * 365]: "1 year",
  [1000 * 60 * 60 * 24 * 365 * 200]: "Never",
} as const;

function CreateNewDialog(props: { open: boolean, onClose(): void }) {
  const stackAdminApp = useAdminApp();
  const project = stackAdminApp.useProjectAdmin();

  const formId = useId();
  const [isCreating, setIsCreating] = useState(false);

  const [returnedApiKey, setReturnedApiKey] = useState<ApiKeySetFirstView | null>(null);
  const [confirmedOnlyOnce, setConfirmedOnlyOnce] = useState(false);

  const close = () => {
    if (returnedApiKey && !confirmedOnlyOnce) return;
    props.onClose();
  };

  return (
    <Modal open={props.open} onClose={close}>
      <ModalDialog minWidth="60vw">
        <DialogTitle>
          <Icon icon='key' />
          Create new API key
        </DialogTitle>
        <Divider />
        {returnedApiKey ? (
          <>
            <DialogContent>
              <Stack spacing={2} overflow='hidden'>
                <Paragraph body>
                  Success! Your new API keys have been created. <Typography fontWeight="bold">Note that you will not be able to view this again</Typography> and you will need to create a new one if you lose it. Visit the <SmartLink target="_blank" href={process.env.NEXT_PUBLIC_DOC_URL}>documentation</SmartLink> for detailed setup instructions.
                </Paragraph>
                <EnvKeys
                  projectId={project.id}
                  publishableClientKey={returnedApiKey.publishableClientKey}
                  secretServerKey={returnedApiKey.secretServerKey}
                  superSecretAdminKey={returnedApiKey.superSecretAdminKey}
                />
                <Checkbox
                  label="I understand that I won't be able to see this API key again and copied it to a safe place."
                  checked={confirmedOnlyOnce}
                  onChange={() => setConfirmedOnlyOnce(!confirmedOnlyOnce)}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <AsyncButton
                color="primary"
                onClick={() => close()}
                disabled={!confirmedOnlyOnce}
              >
                Close
              </AsyncButton>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogContent>
              <form
                id={formId}
                onSubmit={(event) => {
                  runAsynchronously(async () => {
                    event.preventDefault();
                    setIsCreating(true);
                    try {
                      const formData = new FormData(event.currentTarget);
                      const expiresIn = parseInt(formData.get("expiresIn") as string);
                      const returned = await stackAdminApp.createApiKeySet({
                        hasPublishableClientKey: true,
                        hasSecretServerKey: true,
                        hasSuperSecretAdminKey: false,
                        expiresAt: new Date(Date.now() + expiresIn),
                        description: formData.get("description") as string,
                      });
                      setReturnedApiKey(returned);
                    } finally {
                      setIsCreating(false);
                    }
                  });
                }}
              >
                <Stack spacing={2}>
                  <FormControl required>
                    <FormLabel>
                      Description
                    </FormLabel>
                    <Input name="description"/>
                    <FormHelperText>
                      Be descriptive. It will help you remember what this key is for.
                    </FormHelperText>
                  </FormControl>
                  <FormControl required>
                    <FormLabel>
                      Expires in
                    </FormLabel>
                    <Select name="expiresIn">
                      {Object.entries(expiresInOptions).map(([value, label]) => (
                        <Option key={value} value={value}>{label}</Option>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </form>
            </DialogContent>
            <DialogActions>
              <AsyncButton
                color="primary"
                loading={isCreating}
                type="submit"
                form={formId}
              >
                Create
              </AsyncButton>
              <AsyncButton disabled={isCreating} variant="plain" color="neutral" onClick={() => close()}>
                Cancel
              </AsyncButton>
            </DialogActions>
          </>
        )}
      </ModalDialog>
    </Modal>
  );
}
