"use client";;
import * as React from 'react';
import { ApiKeySetSummary } from 'stack-shared';
import { Checkbox, Stack, Tooltip, Typography } from '@mui/joy';
import { Dialog } from '@/components/dialog';
import { useAdminApp } from '../../useAdminInterface';
import Table from '@/components/table';

export function ApiKeysTable(props: {
  rows: ApiKeySetSummary[],
  onInvalidate(): void,
}) {
  const stackAdminApp = useAdminApp();
  const [revokeDialogApiKeySet, setRevokeDialogApiKeySet] = React.useState<ApiKeySetSummary | null>(null);

  return (
    <>
      <Table
        headers={[
          {
            name: 'Name',
            width: 200,
          },
          {
            name: 'Keys',
            width: 150
          },
          {
            name: 'Created',
            width: 150,
          },
          {
            name: 'Expires',
            width: 150
          },
          {
            name: 'Valid',
            width: 60
          }
        ]}
        rows={props.rows.map(key => ({
          id: key.id,
          row: [
            { content: key.description },
            { content: <Stack sx={{ direction: 'column' }}>
              {[
                ["Client", key.publishableClientKey?.lastFour],
                ["Server", key.secretServerKey?.lastFour],
                ["Admin", key.superSecretAdminKey?.lastFour],
              ].filter(([, value]) => value).map(([key, value]) => (<Typography key={key}>{key}: •••••••••{value}</Typography>))}
            </Stack> },
            { content: key.createdAt.toLocaleString() },
            { content: key.expiresAt.toLocaleString() },
            { content: key.whyInvalid() ? (
              <Typography sx={{ color: "red" }}>
                {{
                  "expired": "Expired",
                  "manually-revoked": "Revoked",
                }[key.whyInvalid() as string] ?? "Invalid"}
              </Typography>
            ) : (
              <Tooltip title={"Click to revoke"}>
                <Checkbox size='sm' checked={true} onChange={() => setRevokeDialogApiKeySet(key)} />
              </Tooltip>
            )}
          ]
        }))}
      />
      <Dialog
        title
        danger
        open={!!revokeDialogApiKeySet}
        onClose={() => setRevokeDialogApiKeySet(null)}
        okButton={{
          label: "Revoke API key",
          onClick: async () => {
            if (revokeDialogApiKeySet) {
              await stackAdminApp.revokeApiKeySetById(revokeDialogApiKeySet.id);
              setRevokeDialogApiKeySet(null);
              props.onInvalidate();
            }
          },
        }}
        cancelButton
      >
        Are you sure you want to revoke this API key? This action cannot be undone.
      </Dialog>
    </>
  );
}
