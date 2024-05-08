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
  DialogActions,
  FormHelperText,
} from '@mui/joy';
import { Icon } from '@/components/icon';
import { AsyncButton } from '@/components/async-button';
import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';
import { PermissionGraph, PermissionList } from './permission-list';
import { ServerPermissionDefinitionJson } from '@stackframe/stack-shared/dist/interface/serverInterface';

export function PermissionsTable(props: {
  rows: ServerPermissionDefinitionJson[],
}) {
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
        return permission?.containPermissionIds.join(', ') || '';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      renderHeader: () => <></>,
      type: 'actions',
      width: 48,
      getActions: (params) => [
        <Actions key="more_actions" params={params} rows={props.rows} />,
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
    </>
  );
}


function Actions(props: { params: any, rows: ServerPermissionDefinitionJson[]}) {
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
          <MenuItem color="danger" onClick={() => {
            setIsDeleteModalOpen(true);
          }}>
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
            await stackAdminApp.deletePermissionDefinition(props.params.row.id);
          },
        }}
        cancelButton={true}
      >
        {`Are you sure you want to delete the permission "${props.params.row.name}"? All the permission "${props.params.row.name}" on the existing users will also be removed. All the other permissions that contain this permission will also lose it. and you won't be able to recover it.`}
      </Dialog>

      <EditPermissionModal
        selectedPermissionId={props.params.row.id}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}

function EditPermissionModal(props: { open: boolean, onClose: () => void, selectedPermissionId: string }) {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissionDefinitions();
  const selectedPermission = permissions.find((permission) => permission.id === props.selectedPermissionId);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [containPermissionIds, setContainPermissionIds] = React.useState<string[]>([]);
  const [graph, setGraph] = React.useState<PermissionGraph>();
  const [id, setId] = React.useState<string>(selectedPermission?.id || '');
  const [idError, setIdError] = React.useState<string>('');

  React.useEffect(() => {
    setGraph((new PermissionGraph(permissions)).replacePermission(props.selectedPermissionId));
  }, [permissions, props.selectedPermissionId]);

  React.useEffect(() => {
    setIdError('');
    if (permissions.map(p => p.id).filter(id => id !== props.selectedPermissionId).includes(id)) {
      setIdError('Permission ID already exists');
      return;
    }
  }, [id, permissions, props.selectedPermissionId]);

  const onClose = () => {
    setId(selectedPermission?.id || '');
    setIdError('');
    props.onClose();
  };

  if (!selectedPermission || !graph) return null;

  return (
    <Modal open={props.open} onClose={onClose}>
      <ModalDialog variant="outlined" role="alertdialog" minWidth="60vw">
        <DialogTitle>
          <Icon icon='edit' />
          Edit Permission
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
                    id: `${formData.get('permissionId')}`,
                    description: `${formData.get('description')}` || undefined,
                  };
                  await stackAdminApp.updatePermissionDefinition(
                    selectedPermission.id, 
                    {
                      id: formJson.id,
                      description: formJson.description,
                      containPermissionIds,
                    }
                  );
                  onClose();
                } finally {
                  setIsSaving(false);
                }
              });
            }}
            ref={formRef}
          >
            <Stack spacing={2}>
              <FormControl disabled={isSaving} required error={idError !== ''}>
                <FormLabel htmlFor="permissionId">ID</FormLabel>
                <Input name="permissionId" placeholder="Permission ID" required value={id} onChange={(event) => setId(event.target.value)}/>
                <FormHelperText>
                  {idError}
                </FormHelperText>
              </FormControl>
              <FormControl disabled={isSaving}>
                <FormLabel htmlFor="description">Description</FormLabel>
                <Input name="description" placeholder="Description" defaultValue={selectedPermission.description} />
              </FormControl>
              <PermissionList 
                updatePermission={
                  (permissionId, permission) => {
                    setGraph(graph.updatePermission(permissionId, permission));
                    setContainPermissionIds(permission.containPermissionIds);
                  }}
                permissionGraph={graph} 
                selectedPermissionId={id}
              />
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