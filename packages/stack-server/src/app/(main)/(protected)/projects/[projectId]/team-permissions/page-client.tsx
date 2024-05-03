"use client";

import { Paragraph } from "@/components/paragraph";
import { PermissionsTable } from "./permissions-table";
import { EnableTeam } from "../enable-team";
import { useAdminApp } from "../use-admin-app";
import { AsyncButton } from "@/components/async-button";
import React, { useEffect, useState } from "react";
import { Box, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormLabel, Input, Modal, ModalDialog, Stack } from "@mui/joy";
import { Icon } from "@/components/icon";
import { runAsynchronously } from "@stackframe/stack-shared/dist/utils/promises";
import { PermissionGraph, PermissionList } from "./permission-list";


export default function ClientPage() {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissions();
  const [createPermissionModalOpen, setCreatePermissionModalOpen] = React.useState(false);

  return (
    <>
      <Paragraph h1>
        Team Permissions
      </Paragraph>

      <Stack alignItems={"flex-start"}>
        <AsyncButton
        // onClick={async () => await stackAdminApp.createPermission({
        //   id: (Math.random() * 1000).toString(),
        //   description: "New permission",
        //   inheritFromPermissionIds: [],
        // })}
          onClick={() => setCreatePermissionModalOpen(true)}
        >
        Create Permission
        </AsyncButton>
      </Stack>

      <EnableTeam>
        <PermissionsTable rows={permissions} />
      </EnableTeam>

      <CreatePermissionModal
        open={createPermissionModalOpen}
        onClose={() => setCreatePermissionModalOpen(false)}
      />
    </>
  );
}


function CreatePermissionModal(props: { open: boolean, onClose: () => void }) {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissions();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [inheritFromPermissionIds, setInheritFromPermissionIds] = React.useState<string[]>([]);
  const [graph, setGraph] = useState<PermissionGraph>();
  const [id, setId] = useState<string>();

  useEffect(() => {
    setGraph((new PermissionGraph(permissions)).addPermission());
  }, [permissions]);

  if (!graph) return null;

  return (
    <Modal open={props.open} onClose={() => props.onClose()}>
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
                  await stackAdminApp.createPermission({
                    id: formJson.id,
                    description: formJson.description,
                    inheritFromPermissionIds,
                  });
                  props.onClose();
                } finally {
                  setIsSaving(false);
                }
              });
            }}
            ref={formRef}
          >
            <Stack spacing={2}>
              <FormControl disabled={isSaving}>
                <FormLabel htmlFor="permissionId">ID</FormLabel>
                <Input name="permissionId" placeholder="Permission ID" required value={id} onChange={(event) => setId(event.target.value)}/>
              </FormControl>
              <FormControl disabled={isSaving}>
                <FormLabel htmlFor="description">Description</FormLabel>
                <Input name="description" placeholder="Description" />
              </FormControl>
              <PermissionList 
                updatePermission={(permissionId, permission) => setGraph(graph.updatePermission(permissionId, permission))}
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

