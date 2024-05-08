"use client";

import { Paragraph } from "@/components/paragraph";
import { PermissionsTable } from "./permissions-table";
import { useAdminApp } from "../use-admin-app";
import { AsyncButton } from "@/components/async-button";
import React, { useEffect, useState } from "react";
import {
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalDialog,
  Stack,
} from "@mui/joy";
import { Icon } from "@/components/icon";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { PermissionGraph, PermissionList } from "./permission-list";


export default function ClientPage() {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissionDefinitions();
  const [createPermissionModalOpen, setCreatePermissionModalOpen] = React.useState(false);

  return (
    <>
      <Paragraph h1>
        Team Permissions
      </Paragraph>

      <Stack alignItems={"flex-start"}>
        <AsyncButton onClick={() => setCreatePermissionModalOpen(true)}>
          Create Permission
        </AsyncButton>
      </Stack>

      <PermissionsTable rows={permissions} />

      <CreatePermissionModal
        open={createPermissionModalOpen}
        onClose={() => setCreatePermissionModalOpen(false)}
      />
    </>
  );
}


function CreatePermissionModal(props: { open: boolean, onClose: () => void }) {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissionDefinitions();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [containPermissionIds, setContainPermissionIds] = React.useState<string[]>([]);
  const [graph, setGraph] = useState<PermissionGraph>();
  const [id, setId] = useState<string>('');
  const [idError, setIdError] = useState<string>('');

  useEffect(() => {
    setGraph((new PermissionGraph(permissions)).addPermission());
  }, [permissions]);

  useEffect(() => {
    setIdError('');
    if (permissions.map(p => p.id).includes(id)) {
      setIdError('Permission ID already exists');
      return;
    }
  }, [id, permissions]);

  const onClose = () => {
    setId('');
    setIdError('');
    props.onClose();
  };

  if (!graph) return null;

  return (
    <Modal open={props.open} onClose={onClose}>
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
                  const formData = new FormData(event.currentTarget);
                  const formJson = {
                    id: `${formData.get('permissionId')}`,
                    description: `${formData.get('description')}` || undefined,
                  };
                  await stackAdminApp.createPermissionDefinition({
                    id: formJson.id,
                    description: formJson.description,
                    scope: { type: "any-team" },
                    containPermissionIds,
                  });
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
                <Input name="description" placeholder="Description" />
              </FormControl>
              {permissions.length > 0 &&
              <PermissionList 
                updatePermission={
                  (permissionId, permission) => {
                    setGraph(graph.updatePermission(permissionId, permission));
                    setContainPermissionIds(permission.containPermissionIds);
                  }}
                permissionGraph={graph} 
                selectedPermissionId={id}
              />}
            </Stack>
          </form>
        </DialogContent>
        <DialogActions>
          <AsyncButton
            color="primary"
            loading={isSaving}
            onClick={() => formRef.current!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
            disabled={idError !== '' || id === ''}
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

