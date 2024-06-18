"use client";
import React from "react";
import * as yup from "yup";
import { useAdminApp } from "../use-admin-app";
import { Button } from "@/components/ui/button";
import { PermissionListField } from "@/components/permission-field";
import { PageLayout } from "../page-layout";
import { SmartFormDialog } from "@/components/form-dialog";
import { TeamPermissionTable } from "@/components/data-table/team-permission-table";


export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissionDefinitions();
  const [createPermissionModalOpen, setCreatePermissionModalOpen] = React.useState(false);

  return (
    <PageLayout 
      title="Team Permissions" 
      actions={
        <Button onClick={() => setCreatePermissionModalOpen(true)}>
          Create Permission
        </Button>
      }>

      <TeamPermissionTable permissions={permissions}/>

      <CreateDialog
        open={createPermissionModalOpen}
        onOpenChange={setCreatePermissionModalOpen}
      />
    </PageLayout>
  );
}

function CreateDialog(props: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissionDefinitions();

  const formSchema = yup.object({
    id: yup.string().required()
      .notOneOf(permissions.map((p) => p.id), "ID already exists")
      .matches(/^[a-z0-9_:]+$/, 'Only lowercase letters, numbers, ":" and "_" are allowed')
      .label("ID"),
    description: yup.string().label("Description"),
    containPermissionIds: yup.array().of(yup.string().required()).required().default([]).meta({
      stackFormFieldRender: (props) => (
        <PermissionListField {...props} permissions={permissions} type="new" />
      ),
    }),
  });

  return <SmartFormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Create Permission"
    formSchema={formSchema}
    okButton={{ label: "Create" }}
    onSubmit={async (values) => {
      await stackAdminApp.createPermissionDefinition({
        id: values.id,
        description: values.description,
        scope: { type: "any-team" },
        containPermissionIds: values.containPermissionIds,
      });
    }}
    cancelButton
  />;
}
