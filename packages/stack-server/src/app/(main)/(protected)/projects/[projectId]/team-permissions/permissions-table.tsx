"use client";

import * as React from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Dialog } from '@/components/dialog';
import { useAdminApp } from '../use-admin-app';
import { Permission } from './mock-permissions';
import { Dropdown, Menu, MenuButton, MenuItem, ListDivider, IconButton, ListItemDecorator, Modal, ModalDialog, DialogTitle, Divider, DialogContent, Stack, Box, FormControl, FormLabel, Input, Checkbox, DialogActions, List } from '@mui/joy';
import { Icon } from '@/components/icon';
import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';
import { AsyncButton } from '@/components/async-button';
import { Paragraph } from '@/components/paragraph';

export function PermissionsTable(props: {
  rows: Permission[],
}) {
  const stackAdminApp = useAdminApp();

  const [revokeDialogApiKeySet, setRevokeDialogApiKeySet] = React.useState<Permission | null>(null);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      flex: 1,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      flex: 1,
    },
    {
      field: 'contains',
      headerName: 'Contains',
      width: 300,
      flex: 1,
      renderCell: (params) => {
        const permission = props.rows.find((row) => row.id === params.id);
        return permission?.contains?.join(", ") || "";
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      renderHeader: () => <></>,
      type: 'actions',
      width: 48,
      getActions: (params) => [
        <Actions key="more_actions" params={params} rows={props.rows} />
      ],
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
          label: "Delete Permission",
          onClick: async () => {
            // TODO
          },
        }}
        cancelButton
      >
        {"Are you sure you want to delete the permission? All the permission on users will also be removed, and you won't be able to recover it."}
      </Dialog>
    </>
  );
}


function Actions(props: { params: any, rows: Permission[] }) {
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

      <Dialog
        title
        danger
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        okButton={{
          label: "Delete permission",
          onClick: async () => {
            // await props.params.row.delete();
          }
        }}
        cancelButton={true}
      >
        {`Are you sure you want to delete the permission "${props.params.row.name}"? All the permission "${props.params.row.name}" on the existing users will also be removed. All the other permissions that contain this permission will also lose it. and you won't be able to recover it.`}
      </Dialog>

      <EditUserModal
        selectedPermission={props.params.row}
        permissions={props.rows}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}

export function EditUserModal(props: { selectedPermission: Permission, permissions: Permission[], open: boolean, onClose: () => void }) {
  const stackAdminApp = useAdminApp();

  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [newPermissions, setNewPermissions] = React.useState<Permission[]>(props.permissions.map((p) => ({ ...p })));
  const newSelectedPermission = newPermissions.find((p) => p.id === props.selectedPermission.id);
  if (!newSelectedPermission) {
    return null;
  }

  return (
    <Modal open={props.open} onClose={() => props.onClose()}>
      <ModalDialog variant="outlined" role="alertdialog" minWidth="60vw">
        <DialogTitle>
          <Icon icon='edit' />
          Edit permission
        </DialogTitle>
        <Divider />
        <DialogContent>
          <form
            onSubmit={(event) => {
              // runAsynchronously(async () => {
              //   event.preventDefault();
              //   setIsSaving(true);
              //   try {
              //     const formData = new FormData(event.currentTarget);
              //     const formJson = {
              //       displayName: `${formData.get('displayName')}` || null,
              //       primaryEmail: `${formData.get('email')}` || null,
              //       primaryEmailVerified: formData.get('primaryEmailVerified') === "on",
              //       signedUpAtMillis: new Date(formData.get('signedUpAt') as string).getTime(),
              //     };
              //     await props.user.update(formJson);
              //     props.onClose();
              //   } finally {
              //     setIsSaving(false);
              //   }
              // });
            }}
            ref={formRef}
          >
            <Stack spacing={2}>
              <FormControl disabled={isSaving}>
                <FormLabel htmlFor="displayName">Name</FormLabel>
                <Input name="name" placeholder="name" defaultValue={props.selectedPermission.name} required />
              </FormControl>
              <FormControl disabled={isSaving}>
                <FormLabel htmlFor="description">Description</FormLabel>
                <Input name="description" placeholder="description" defaultValue={props.selectedPermission.description} required />
              </FormControl>
              <FormLabel htmlFor="contains">Contains permissions from</FormLabel>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {newPermissions.map((permission) => {
                  if (permission.id === newSelectedPermission.id) return null;
                  const contain = newSelectedPermission.contains?.includes(permission.name);
                  const inheritedFrom: string[] = [];
                  // newSelectedPermission.contains?.find((p) => props.permissions.find((p2) => p2.name === p)?.has(p));  
                  for (const p of newSelectedPermission.contains || []) {
                    const p2 =newPermissions.find((p2) => p2.name === p);
                    if (p2?.has(permission.name)) {
                      inheritedFrom.push(p);
                    }
                  }
                  const inherited = newSelectedPermission.has(permission.name) && !contain;
                  return (
                    <>
                      <Stack key={permission.id} spacing={1} direction={"row"} alignItems={"center"}>
                        <Checkbox
                          key={permission.id}
                          value={permission.id}
                          checked={contain}
                          // variant={inherited ? "solid" : "outlined"}
                          // color={'primary'}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setNewPermissions((permissions) => permissions.map((p) => {
                              if (p.id === newSelectedPermission.id) {
                                p.contains = p.contains?.filter((c) => c !== permission.name);
                                if (checked) {
                                  p.contains = [...(p.contains || []), permission.name];
                                }
                              }
                              return p;
                            }));
                            console.log(newPermissions);
                          }}
                        />
                        <Paragraph body>
                          {permission.name}
                          {inherited && <span> (inherited from {inheritedFrom.join(', ')})</span>}
                        </Paragraph>
                      </Stack>
                      <Divider sx={{ margin: 1 }} />
                    </>
                  );
                })}
              </List>
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