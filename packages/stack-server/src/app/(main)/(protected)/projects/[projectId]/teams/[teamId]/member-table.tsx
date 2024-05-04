"use client";;
import * as React from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import {
  Avatar,
  Box,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Dropdown,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Modal,
  ModalDialog,
  Stack,
  Tooltip,
} from '@mui/joy';
import { Icon } from '@/components/icon';
import { Dialog } from '@/components/dialog';
import { ServerTeam, ServerUser } from '@stackframe/stack';
import { PageLoadingIndicator } from '@/components/page-loading-indicator';
import { useAdminApp } from '../../use-admin-app';
import { EditUserModal } from '../../users/users-table';
import { Paragraph } from '@/components/paragraph';
import { PermissionGraph, PermissionList } from '../../team-permissions/permission-list';
import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';
import { AsyncButton } from '@/components/async-button';

export function MemberTable(props: {
  rows: ServerUser[],
  team: ServerTeam,
}) {
  const [pageLoadingIndicatorCount, setPageLoadingIndicatorCount] = React.useState(0);

  const columns: (GridColDef & {
    stackOnProcessUpdate?: (updatedRow: ServerUser, oldRow: ServerUser) => Promise<void>,
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
      width: 100,
      flex: 1,
    },
    {
      field: 'primaryEmail',
      headerName: 'E-Mail',
      width: 200,
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
      field: 'permissions',
      headerName: 'Permissions',
      width: 200,
      renderCell: async (params: { row: ServerUser }) => {
        const permissions = await params.row.listPermissions(props.team);
        return (
          <Paragraph body>
            {permissions.map(permission => permission.id).join(', ')}
          </Paragraph>
        );
      }
    },
    {
      field: 'signedUpAt',
      headerName: 'Signed up',
      type: 'dateTime',
      width: 200,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      renderHeader: () => <></>,
      type: 'actions',
      width: 48,
      getActions: (params) => [
        <Actions key="more_actions" params={params} team={props.team} />,
      ],
    },
  ];

  return (
    <>
      {pageLoadingIndicatorCount > 0 && (
        <PageLoadingIndicator />
      )}
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
          setPageLoadingIndicatorCount(c => c + 1);
          try {
            await Promise.all(columns.map(async column => {
              if (column.editable && column.stackOnProcessUpdate) {
                await column.stackOnProcessUpdate(updatedRow, originalRow);
              }
            }));
            return updatedRow;
          } finally {
            setPageLoadingIndicatorCount(c => c - 1);
          }
        }}
        pageSizeOptions={[5, 15, 25]}
      />
    </>
  );
}

function Actions(props: { params: any, team: ServerTeam }) {
  const stackAdminApp = useAdminApp();

  const [isEditUserModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isEditPermissionModalOpen, setIsEditPermissionModalOpen] = React.useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = React.useState(false);
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
          <MenuItem onClick={() => setIsEditPermissionModalOpen(true)}>
            <ListItemDecorator>
              <Icon icon='lock' />
            </ListItemDecorator>{' '}
            Edit Permission
          </MenuItem>
          <MenuItem onClick={() => setIsEditModalOpen(true)}>
            <ListItemDecorator>
              <Icon icon='edit' />
            </ListItemDecorator>{' '}
            Edit User
          </MenuItem>
          <ListDivider />
          <MenuItem color="danger" onClick={() => setIsRemoveModalOpen(true)}>
            <ListItemDecorator sx={{ color: 'inherit' }}>
              <Icon icon='logout' />
            </ListItemDecorator>{' '}
            Remove from team
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
        open={isEditUserModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <EditPermissionModal
        user={props.params.row}
        team={props.team}
        open={isEditPermissionModalOpen}
        onClose={() => setIsEditPermissionModalOpen(false)}
      />

      <Dialog
        title
        danger
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        okButton={{
          label: "Delete user",
          onClick: async () => {
            await props.params.row.delete();
          }
        }}
        cancelButton={true}
      >
        Are you sure you want to delete the user &apos;{props.params.row.displayName}&apos; with ID {props.params.row.id}? This action cannot be undone.
      </Dialog>

      <Dialog
        title
        danger
        open={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        okButton={{
          label: "Remove user from team",
          onClick: async () => {
            await props.team.removeUser(props.params.row.id);
          }
        }}
        cancelButton={true}
      >
        Are you sure you want to remove the user &apos;{props.params.row.displayName}&apos; with ID {props.params.row.id} from the team?
      </Dialog>
    </>
  );
}


function EditPermissionModal(props: { open: boolean, onClose: () => void, user: ServerUser, team: ServerTeam }) {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissionDefinitions();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [inheritFromPermissionIds, setInheritFromPermissionIds] = React.useState<string[]>([]);
  const [graph, setGraph] = React.useState<PermissionGraph>();
  const [id, setId] = React.useState<string>('');

  React.useEffect(() => {
    async function load() {
      setGraph((new PermissionGraph(permissions)).addPermission(
        (await props.user.listPermissions(props.team)).map(permission => permission.id)
      ));
    }
    load().catch(console.error);
  }, [permissions, props.user, props.team]);

  if (!graph) return null;

  return (
    <Modal open={props.open} onClose={() => props.onClose()}>
      <ModalDialog variant="outlined" role="alertdialog" minWidth="60vw">
        <DialogTitle>
          <Icon icon='edit' />
          Create Permission
        </DialogTitle>
        <Divider />
        <DialogContent>
          <form
            onSubmit={(event) => {
              runAsynchronously(async () => {
                event.preventDefault();
                setIsSaving(true);
                // try {
                //   const formData = new FormData(event.currentTarget);
                //   const formJson = {
                //     id: `${formData.get('permissionId')}`,
                //     description: `${formData.get('description')}` || undefined,
                //   };
                //   await stackAdminApp.createPermission({
                //     id: formJson.id,
                //     description: formJson.description,
                //     inheritFromPermissionIds,
                //   });
                //   props.onClose();
                // } finally {
                //   setIsSaving(false);
                // }
              });
            }}
            ref={formRef}
          >
            <Stack spacing={2}>
              <Paragraph body>
                Display name: {props.user.displayName}
              </Paragraph>
              <Paragraph body>
                ID: {props.user.id}
              </Paragraph>
              <PermissionList 
                updatePermission={
                  (permissionId, permission) => {
                    setGraph(graph.updatePermission(permissionId, permission));
                    setInheritFromPermissionIds(permission.inheritFromPermissionIds);
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

