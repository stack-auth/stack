"use client";

import * as React from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Avatar, Box, Checkbox, DialogActions, DialogContent, DialogTitle, Divider, Dropdown, FormControl, FormLabel, IconButton, Input, ListDivider, ListItemDecorator, Menu, MenuButton, MenuItem, Modal, ModalDialog, Stack, Tooltip } from '@mui/joy';
import { getInputDatetimeLocalString } from '@stackframe/stack-shared/dist/utils/dates';
import { Icon } from '@/components/icon';
import { AsyncButton } from '@/components/async-button';
import { Dialog } from '@/components/dialog';
import { useAdminApp } from '../../useAdminInterface';
import { runAsynchronously } from '@stackframe/stack-shared/src/utils/promises';
import { ServerUserJson } from '@stackframe/stack-shared';

export function UsersTable(props: {
  rows: ServerUserJson[],
  onInvalidate(): void,
}) {
  const stackAdminApp = useAdminApp();

  const columns: (GridColDef & {
    stackOnProcessUpdate?: (updatedRow: ServerUserJson, oldRow: ServerUserJson) => Promise<void>,
  })[] = [
    {
      field: 'profilePicture',
      headerName: 'Profile picture',
      renderHeader: () => <></>,
      width: 50,
      filterable: false,
      sortable: false,
      renderCell: (params) => params.row.profileImageUrl ? (
        <Avatar size='sm' src={params.row.profileImageUrl} alt={`${params.row.displayName}'s profile picture`} />
      ) : (
        <Avatar size='sm'>{
          params.row.displayName
            ?.split(/\s/)
            .map((x: string) => x[0])
            .filter((x: string) => x)
            .join("")
        }</Avatar>
      ),
    },
    {
      field: 'id',
      headerName: 'ID',
      width: 100,
    },
    {
      field: 'displayName',
      headerName: 'Display name',
      width: 150,
      flex: 1,
      editable: true,
      stackOnProcessUpdate: async (updatedRow, originalRow) => {
        await stackAdminApp.setServerUserCustomizableData(originalRow.id, { displayName: updatedRow.displayName });
      },
    },
    {
      field: 'primaryEmail',
      headerName: 'E-Mail',
      width: 200,
      editable: true,
      stackOnProcessUpdate: async (updatedRow, originalRow) => {
        await stackAdminApp.setServerUserCustomizableData(originalRow.id, { primaryEmail: updatedRow.primaryEmail, primaryEmailVerified: false });
      },
      renderCell: (params) => (
        <>
          <Box display="block" minWidth={0} overflow="hidden" textOverflow="ellipsis">
            {params.row.primaryEmail}
          </Box>
          {!params.row.primaryEmailVerified && (
            <>
              <Box width={4} flexGrow={0} />
              <Tooltip title="Unverified e-mail">
                <Stack>
                  <Icon icon='error' color="red" size={18} />
                </Stack>
              </Tooltip>
              <Box width={0} flexGrow={1} />
            </>
          )}
        </>
      ),
    },
    {
      field: 'signedUpAtMillis',
      headerName: 'Signed up',
      type: 'dateTime',
      valueFormatter: (params) => new Date(params.value as number).toLocaleString(),
      width: 200,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      renderHeader: () => <></>,
      type: 'actions',
      width: 48,
      getActions: (params) => [
        <Actions key="more_actions" params={params} onInvalidate={() => props.onInvalidate()} />
      ],
    },
  ];

  return (
    <DataGrid
      slots={{
        toolbar: GridToolbar,
      }}
      autoHeight
      rows={props.rows}
      columns={columns}
      initialState={{
        pagination: { paginationModel: { pageSize: 15 } },
      }}
      
      processRowUpdate={async (updatedRow, originalRow) => {
        for (const column of columns) {
          if (column.editable && column.stackOnProcessUpdate) {
            await column.stackOnProcessUpdate(updatedRow, originalRow);
          }
        }
        props.onInvalidate();
        return originalRow;
      }}
      pageSizeOptions={[5, 15, 25]}
    />
  );
}

function Actions(props: { params: any, onInvalidate: () => void}) {
  const stackAdminApp = useAdminApp();

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  
  return (
    <>
      <Dropdown key="more_actions">
        <MenuButton
          slots={{ root: IconButton }}
        >
          <Icon icon="more_vert" />
        </MenuButton>
        <Menu placement="bottom-end">
          <MenuItem onClick={() => setIsEditModalOpen(true)}>
            <ListItemDecorator>
              <Icon icon='edit' />
            </ListItemDecorator>{' '}
            Edit
          </MenuItem>
          <ListDivider />
          <MenuItem color="danger" onClick={() => setIsDeleteModalOpen(true)}>
            <ListItemDecorator sx={{ color: 'inherit' }}>
              <Icon icon='delete' />
            </ListItemDecorator>{' '}
            Delete
          </MenuItem>
        </Menu>
      </Dropdown>

      <EditUserModal
        user={props.params.row}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onInvalidate={() => props.onInvalidate()}
      />

      <Dialog
        title
        danger
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        okButton={{
          label: "Delete user",
          onClick: async () => {
            await stackAdminApp.deleteServerUser(props.params.row.id);
            props.onInvalidate();
          }
        }}
        cancelButton={true}
      >
        Are you sure you want to delete the user &apos;{props.params.row.displayName}&apos; with ID {props.params.row.id}? This action cannot be undone.
      </Dialog>
    </>
  );
}


function EditUserModal(props: { user: ServerUserJson, open: boolean, onClose: () => void, onInvalidate: () => void }) {
  const stackAdminApp = useAdminApp();

  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  return (
    <Modal open={props.open} onClose={() => props.onClose()}>
      <ModalDialog variant="outlined" role="alertdialog" minWidth="60vw">
        <DialogTitle>
          <Icon icon='edit' />
          Edit user
        </DialogTitle>
        <Divider />
        <DialogContent>
          <form
            onSubmit={(event) => {
              runAsynchronously(async () => {
                event.preventDefault();
                setIsSaving(true);
                try {
                  const formData = new FormData(event.currentTarget);
                  const formJson = {
                    displayName: `${formData.get('displayName')}` || null,
                    primaryEmail: `${formData.get('email')}` || null,
                    primaryEmailVerified: formData.get('primaryEmailVerified') === "on",
                    signedUpAtMillis: new Date(formData.get('signedUpAt') as string).getTime(),
                  };
                  await stackAdminApp.setServerUserCustomizableData(props.user.id, formJson);
                  props.onInvalidate();
                  props.onClose();
                } finally {
                  setIsSaving(false);
                }
              });
            }}
            ref={formRef}
          >
            <Stack spacing={2}>
              <Box>
                    ID: {props.user.id}
              </Box>
              <FormControl disabled={isSaving}>
                <FormLabel htmlFor="displayName">Display name</FormLabel>
                <Input name="displayName" placeholder="Display name" defaultValue={props.user.displayName ?? ""} required />
              </FormControl>
              <Stack direction="row" spacing={2} alignItems="flex-end">
                <Box flexGrow={1}>
                  <FormControl disabled={isSaving}>
                    <FormLabel htmlFor="email">E-Mail</FormLabel>
                    <Input name="email" type="email" placeholder="E-Mail" defaultValue={props.user.primaryEmail ?? ""} required />
                  </FormControl>
                </Box>
                <Stack height={36} justifyContent="center">
                  <FormControl disabled={isSaving}>
                    <Checkbox name="primaryEmailVerified" defaultChecked={props.user.primaryEmailVerified} label="Verified" />
                  </FormControl>
                </Stack>
              </Stack>
              <FormControl disabled={isSaving}>
                <FormLabel htmlFor="signedUpAt">Signed up</FormLabel>
                <Input name="signedUpAt" type="datetime-local" defaultValue={getInputDatetimeLocalString(new Date(props.user.signedUpAtMillis))} required />
              </FormControl>
            </Stack>
          </form>
        </DialogContent>
        <DialogActions>
          <AsyncButton
            color="primary"
            loading={isSaving}
            onClick={() => formRef.current!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
          >
              Save
          </AsyncButton>
          <AsyncButton variant="plain" color="neutral" disabled={isSaving} onClick={() => props.onClose()}>
              Cancel
          </AsyncButton>
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
}
