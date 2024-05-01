"use client";;
import * as React from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import {
  Avatar,
  Box,
  Dropdown,
  IconButton,
  ListDivider,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Tooltip,
} from '@mui/joy';
import { Icon } from '@/components/icon';
import { Dialog } from '@/components/dialog';
import { ServerUser } from '@stackframe/stack';
import { PageLoadingIndicator } from '@/components/page-loading-indicator';
import { useAdminApp } from '../../use-admin-app';
import { EditUserModal } from '../../users/users-table';

export function MemberTable(props: {
  rows: ServerUser[],
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
      width: 150,
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
        <Actions key="more_actions" params={params} />
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

function Actions(props: { params: any }) {
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
          <MenuItem>
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
    </>
  );
}