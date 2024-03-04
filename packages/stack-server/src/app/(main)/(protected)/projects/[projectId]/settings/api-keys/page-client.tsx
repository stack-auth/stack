"use client";

import { use, useId, useState } from "react";
import { Box, Button, Checkbox, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormLabel, Input, Modal, ModalDialog, Select, Option, Stack, FormHelperText, Typography } from "@mui/joy";
import { ApiKeySetFirstView } from "@stackframe/stack-shared";
import { AsyncButton } from "@/components/async-button";
import { Icon } from "@/components/icon";
import { Paragraph } from "@/components/paragraph";
import { CopyButton } from "@/components/copy-button";
import { useStrictMemo } from "@stackframe/stack-shared/src/hooks/use-strict-memo";
import { ApiKeysTable } from "./api-keys-table";
import { useAdminApp } from "../../useAdminInterface";
import { runAsynchronously } from "@stackframe/stack-shared/src/utils/promises";
import EnvKeys from "@/components/env-keys";
import Link from "next/link";


export default function ApiKeysDashboardClient() {
  const stackAdminApp = useAdminApp();

  const [invalidationCounter, setInvalidationCounter] = useState(0);
  const apiKeySetsPromise = useStrictMemo(() => {
    return stackAdminApp.listApiKeySets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidationCounter]);
  const apiKeySets = use(apiKeySetsPromise);

  const [isNewApiKeyDialogOpen, setIsNewApiKeyDialogOpen] = useState(false);
  
  const invalidate = () => {
    setInvalidationCounter(c => c + 1);
  };

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

      <ApiKeysTable rows={apiKeySets} onInvalidate={() => invalidate()} />

      <CreateNewDialog
        key={`${isNewApiKeyDialogOpen}`}
        open={isNewApiKeyDialogOpen}
        onClose={() => setIsNewApiKeyDialogOpen(false)}
        onInvalidate={() => invalidate()}
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

function CreateNewDialog(props: { open: boolean, onClose(): void, onInvalidate(): void }) {
  const stackAdminApp = useAdminApp();

  const formId = useId();
  const [isCreating, setIsCreating] = useState(false);

  const [returnedApiKey, setReturnedApiKey] = useState<ApiKeySetFirstView | null>(null);
  const [confirmedOnlyOnce, setConfirmedOnlyOnce] = useState(false);

  const projectPromise = useStrictMemo(() => {
    return stackAdminApp.getProject();
  }, []);
  const project = use(projectPromise);

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
                  Success! Your new API keys have been created. <Typography fontWeight="bold">Note that you will not be able to view this again</Typography> and you will need to create a new one if you lose it. Detailed setup instructions can be found <Link rel="noopener noreferrer" target="_blank" href={process.env.NEXT_PUBLIC_DOC_URL || ""}>here</Link>
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
                      props.onInvalidate();
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
