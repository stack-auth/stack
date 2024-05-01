"use client";;
import * as React from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import {
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
} from '@mui/joy';
import { Icon } from '@/components/icon';
import { AsyncButton } from '@/components/async-button';
import { Dialog } from '@/components/dialog';
import { useAdminApp } from '../use-admin-app';
import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';
import { PageLoadingIndicator } from '@/components/page-loading-indicator';
import { useRouter } from 'next/navigation';
import { ServerTeam } from '@stackframe/stack';

export function TeamTable(props: {
  rows: ServerTeam[],
}) {
  const [pageLoadingIndicatorCount, setPageLoadingIndicatorCount] = React.useState(0);

  const columns: (GridColDef & {
    stackOnProcessUpdate?: (updatedRow: ServerTeam, oldRow: ServerTeam) => Promise<void>,
  })[] = [
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
      field: 'createdAt',
      headerName: 'Created at',
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
  const router = useRouter();

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
          <MenuItem onClick={() => router.push(`/projects/${stackAdminApp.projectId}/teams/${props.params.row.id}`)}>
            <ListItemDecorator>
              <Icon icon='person' />
            </ListItemDecorator>{' '}
            View Members
          </MenuItem>
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

      <EditTeamModal
        team={props.params.row}
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


function EditTeamModal(props: { team: ServerTeam, open: boolean, onClose: () => void }) {
  const stackAdminApp = useAdminApp();

  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  return (
    <Modal open={props.open} onClose={() => props.onClose()}>
      <ModalDialog variant="outlined" role="alertdialog" minWidth="60vw">
        <DialogTitle>
          <Icon icon='edit' />
          Edit Team
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
                    displayName: `${formData.get('displayName')}` || undefined,
                  };
                  // await props.team.update(formJson);
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
                ID: {props.team.id}
              </Box>
              <FormControl disabled={isSaving}>
                <FormLabel htmlFor="displayName">Display name</FormLabel>
                <Input name="displayName" placeholder="Display name" defaultValue={props.team.displayName ?? ""} required />
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
