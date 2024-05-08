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
  IconButton,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Modal,
  ModalDialog,
  Stack,
  Tooltip,
  Typography,
} from '@mui/joy';
import { Icon } from '@/components/icon';
import { Dialog } from '@/components/dialog';
import { ServerPermission, ServerTeam, ServerUser, ServerTeamMember } from '@stackframe/stack';
import { PageLoadingIndicator } from '@/components/page-loading-indicator';
import { useAdminApp } from '../../use-admin-app';
import { EditUserModal } from '../../users/users-table';
import { Paragraph } from '@/components/paragraph';
import { PermissionGraph, PermissionList } from '../../team-permissions/permission-list';
import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';
import { AsyncButton } from '@/components/async-button';

export function MemberTable(props: {
  rows: ServerTeamMember[],
  team: ServerTeam,
}) {
  const [pageLoadingIndicatorCount, setPageLoadingIndicatorCount] = React.useState(0);
  const [userPermissions, setUserPermissions] = React.useState<Record<string, ServerPermission[]>>({});
  const [updateCounter, setUpdateCounter] = React.useState(0);
  const [users, setUsers] = React.useState<ServerUser[]>();

  React.useEffect(() => {
    async function load() {
      const promises = props.rows.map(async member => {
        const user = await member.getUser();
        const permissions = await user.listPermissions(props.team, { direct: true });
        return {
          user,
          permissions,
        };
      });
      return await Promise.all(promises);
    }
    
    load().then((data) => {
      setUserPermissions(Object.fromEntries(
        props.rows.map((member, index) => [member.userId, data[index].permissions])
      ));
      setUsers(data.map(d => d.user));
    }).catch(console.error);
  }, [props.rows, props.team, updateCounter]);

  if (!users) return null;

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
        return (
          <Paragraph body>
            {userPermissions[params.row.id]?.map(permission => permission.id).join(', ') || ''}
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
        <Actions key="more_actions" params={params} team={props.team} setUpdateCounter={setUpdateCounter} />,
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
        rows={users}
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

function Actions(props: { params: any, team: ServerTeam, setUpdateCounter: React.Dispatch<React.SetStateAction<number>> }) {
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
        setUpdateCounter={props.setUpdateCounter}
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


function EditPermissionModal(props: { 
  open: boolean, 
  onClose: () => void, 
  user: ServerUser, 
  team: ServerTeam, 
  setUpdateCounter: React.Dispatch<React.SetStateAction<number>>,
}) {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissionDefinitions();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [containPermissionIds, setContainPermissionIds] = React.useState<string[]>([]);
  const [graph, setGraph] = React.useState<PermissionGraph>();

  React.useEffect(() => {
    async function load() {
      setGraph((new PermissionGraph(permissions)).addPermission(
        (await props.user.listPermissions(props.team, { direct: true })).map(permission => permission.id)
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
                try {
                  const promises = containPermissionIds.map(async permissionId => {
                    await props.user.grantPermission(props.team, permissionId);
                  });
                  promises.push(...permissions.filter(
                    p => !containPermissionIds.includes(p.id)
                  ).map(async permission => {
                    await props.user.revokePermission(props.team, permission.id);
                  }));
                  await Promise.all(promises);

                  props.setUpdateCounter?.((c: number) => c + 1);
                  props.onClose();
                } finally {
                  setIsSaving(false);
                }
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
              {permissions.length > 0 ?
                <PermissionList 
                  updatePermission={
                    (permissionId, permission) => {
                      setGraph(graph.updatePermission(permissionId, permission));
                      setContainPermissionIds(permission.containPermissionIds);
                    }}
                  permissionGraph={graph}
                /> : <Typography>No permissions available. Please create a permission first.</Typography>}
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

