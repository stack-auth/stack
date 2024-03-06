"use client";

import * as React from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Checkbox, Stack, Tooltip, Typography } from '@mui/joy';
import { Dialog } from '@/components/dialog';
import { useAdminApp } from '../../use-admin-app';
import { ApiKeySet } from '@stackframe/stack/dist/lib/stack-app';

export function ApiKeysTable(props: {
  rows: ApiKeySet[],
}) {
  const stackAdminApp = useAdminApp();

  const [revokeDialogApiKeySet, setRevokeDialogApiKeySet] = React.useState<ApiKeySet | null>(null);

  const columns: GridColDef[] = [
    {
      field: 'description',
      headerName: 'Description',
      width: 250,
      flex: 1,
    },
    {
      field: 'availableKeys',
      headerName: 'Key values',
      width: 200,
      filterable: false,
      sortable: false,
      valueGetter: (params) => {
        return [
          ["Client", params.row.publishableClientKey?.lastFour],
          ["Server", params.row.secretServerKey?.lastFour],
          ["Admin", params.row.superSecretAdminKey?.lastFour],
        ].filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join("\n");
      },
      renderCell: (params) => {
        return (
          <Tooltip title="Full API keys cannot be viewed after creation.">
            <Stack spacing={0}>
              {params.row.publishableClientKey && (
                <Box>
                  Client: ••••••••••{params.row.publishableClientKey.lastFour}
                </Box>
              )}
              {params.row.secretServerKey && (
                <Box>
                  Server: ••••••••••{params.row.secretServerKey.lastFour}
                </Box>
              )}
              {params.row.superSecretAdminKey && (
                <Box>
                  Admin: •••••••••••{params.row.superSecretAdminKey.lastFour}
                </Box>
              )}
            </Stack>
          </Tooltip>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 200,
    },
    {
      field: 'expiresAt',
      headerName: 'Expires',
      width: 200,
      type: 'dateTime',
    },
    {
      field: 'isValid',
      headerName: 'Is Valid',
      width: 100,
      type: 'boolean',
      valueGetter: (params) => params.row.isValid(),
      renderCell: (params) => {
        const invalidReason = params.row.whyInvalid();
        if (invalidReason) {
          return (
            <Typography sx={{ color: "red" }}>
              {{
                "expired": "Expired",
                "manually-revoked": "Revoked",
              }[invalidReason as string] ?? "Invalid"}
            </Typography>
          );
        } else {
          return (
            <Tooltip title={"Click to revoke"}>
              <Checkbox checked={true} onChange={() => setRevokeDialogApiKeySet(params.row)} />
            </Tooltip>
          );
        }
      },
    },
  ];

  return (
    <>
      <DataGrid
        slots={{
          toolbar: GridToolbar,
        }}
        autoHeight
        rows={props.rows}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { pageSize: 15 } },
          columns: {
            columnVisibilityModel: {
              createdAt: false,
            },
          },
        }}
        pageSizeOptions={[5, 15, 25]}
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
              await revokeDialogApiKeySet.revoke();
              setRevokeDialogApiKeySet(null);
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
