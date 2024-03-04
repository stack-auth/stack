"use client";;
import * as React from 'react';
import {
  Avatar,
  Box,
  Checkbox,
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
import { fromNowDetailed, getInputDatetimeLocalString } from '@stackframe/stack-shared/dist/utils/dates';
import { Icon } from '@/components/icon';
import { AsyncButton } from '@/components/async-button';
import { Dialog } from '@/components/dialog';
import { useAdminApp } from '../../useAdminInterface';
import { runAsynchronously } from '@stackframe/stack-shared/src/utils/promises';
import { ServerUserJson } from '@stackframe/stack-shared';
import Table from '@/components/table';

export function UsersTable(props: {
  rows: ServerUserJson[],
  onInvalidate(): void,
}) {
  return (
    <Table
      headers={[
        {
          name: 'ID',
          width: 80,
        },
        {
          name: 'Avatar',
          width: 80
        },
        {
          name: 'Display Name',
          width: 150
        },
        {
          name: 'Email',
          width: 200
        },
        {
          name: 'Sign Up Time',
          width: 100
        },
        {
          name: '',
          width: 50
        }
      ]}
      rows={props.rows.map(user => ({
        id: user.id,
        row: [
          { content: user.id },
          { 
            content: <Avatar
              variant="outlined"
              size="sm"
              src={user.profileImageUrl || undefined}
            />
          },
          { content: user.displayName },
          { content: user.primaryEmail },
          { content: fromNowDetailed(new Date(user.signedUpAtMillis)).result },
          { content: <Actions key="more_actions" onInvalidate={() => props.onInvalidate()} user={user} /> }
        ]
      }))}
    />
    // <Sheet
    //   className="OrderTableContainer"
    //   variant="plain"
    //   sx={{
    //     display: 'initial',
    //     width: '100%',
    //     borderRadius: 'sm',
    //     flexShrink: 1,
    //     overflow: 'auto',
    //     minHeight: 0,
    //   }}
    // >
    //   <Table
    //     aria-labelledby="tableTitle"
    //     stickyHeader
    //     hoverRow
    //     sx={{
    //       '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
    //       '--Table-headerUnderlineThickness': '1px',
    //       '--TableRow-hoverBackground': 'var(--joy-palette-background-level1)',
    //       '--TableCell-paddingY': '4px',
    //       '--TableCell-paddingX': '8px',
    //     }}
    //   >
    //     <thead>
    //       <tr>
    //         <th style={{ width: 80, ...headerStyle }}>
    //           ID
    //         </th>
    //         <th style={{ width: 80, ...headerStyle }}>
    //           Avatar
    //         </th>
    //         <th style={{ width: 150, ...headerStyle }}>
    //           Display Name
    //         </th>
    //         <th style={{ width: 200, ...headerStyle }}>
    //           Email
    //         </th>
    //         {/* <th style={{ width: 50, ...headerStyle }}>
    //           Provider
    //         </th> */}
    //         <th style={{ width: 100, ...headerStyle }}>
    //           Sign Up Time
    //         </th>
    //         <th style={{ width: 50, ...headerStyle }}>
    //         </th>
    //       </tr>
    //     </thead>
    //     <tbody>
    //       {props.rows.map(user => (
    //         <tr key={user.id} style={{}}>
    //           <td style={cellStyle}>
    //             {user.id}
    //           </td>
    //           <td>
  // <Avatar
  //   variant="outlined"
  //   size="sm"
  //   src={user.profileImageUrl || undefined}
  // />
    //           </td>
    //           <td style={cellStyle}>
    //             {user.displayName}
    //           </td>
    //           <td style={cellStyle}>
    //             {user.primaryEmail}
    //           </td>
    //           {/* <td>
    //             <Chip>

  //             </Chip>
  //           </td> */}
  //           <td>
  //             {fromNowDetailed(new Date(user.signedUpAtMillis)).result}
  //           </td>
  //           <td>
  //             <Actions key="more_actions" onInvalidate={() => props.onInvalidate()} user={user} />
  //           </td>
  //         </tr>
  //       ))}
  //     </tbody>
  //   </Table>
  // </Sheet>
  );
}

function Actions(props: { user: ServerUserJson, onInvalidate: () => void }) {
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
        user={props.user}
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
            await stackAdminApp.deleteServerUser(props.user.id);
            props.onInvalidate();
          }
        }}
        cancelButton={true}
      >
        Are you sure you want to delete the user &apos;{props.user.displayName}&apos; with ID {props.user.id}? This action cannot be undone.
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
