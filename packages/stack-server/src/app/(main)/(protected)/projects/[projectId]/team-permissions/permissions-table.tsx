"use client";;
import * as React from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Dialog } from '@/components/dialog';
import { useAdminApp } from '../use-admin-app';
import {
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  ListDivider,
  IconButton,
  ListItemDecorator,
  Modal,
  ModalDialog,
  DialogTitle,
  Divider,
  DialogContent,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  DialogActions,
  List,
} from '@mui/joy';
import { Icon } from '@/components/icon';
import { AsyncButton } from '@/components/async-button';
import { Paragraph } from '@/components/paragraph';
import { Permission, ServerPermission } from '@stackframe/stack';
import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';
import { PermissionList } from './permission-list';

export function PermissionsTable(props: {
  rows: ServerPermission[],
}) {
  const stackAdminApp = useAdminApp();

  const [revokeDialogApiKeySet, setRevokeDialogApiKeySet] = React.useState<Permission | null>(null);

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
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
        return permission?.inheritFromPermissionIds.join(', ') || '';
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

      {/* <EditUserModal
        selectedPermission={props.params.row}
        permissions={props.rows}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      /> */}
    </>
  );
}