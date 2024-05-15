"use client";;
import React from "react";
import * as yup from "yup";
import { PermissionsTable } from "./permissions-table";
import { useAdminApp } from "../use-admin-app";
import { Button } from "@/components/ui/button";
import { PermissionListField } from "../../../../../../components/permission-field";
import { PageLayout } from "../page-layout";
import { FormDialog } from "@/components/form-dialog";
import { InputField } from "@/components/form-fields";
import { TeamPermissionTable } from "@/components/data-table/team-permission-table";


export default function ClientPage() {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissionDefinitions();
  const [createPermissionModalOpen, setCreatePermissionModalOpen] = React.useState(false);

  return (
    <PageLayout 
      title="Team Permissions" 
      description="Manage team permissions" 
      actions={
        <Button onClick={() => setCreatePermissionModalOpen(true)}>
          Create Permission
        </Button>
      }>

      {/* <PermissionsTable rows={permissions} /> */}
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
    id: yup.string().required().notOneOf(permissions.map((p) => p.id), "ID already exists"),
    description: yup.string(),
    containPermissionIds: yup.array().of(yup.string().required()).required(),
  });
  const defaultValues = {
    containPermissionIds: [],
  };

  return <FormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Create Permission"
    formSchema={formSchema}
    defaultValues={defaultValues}
    okButton={{ label: "Save" }}
    render={(form) => (
      <>
        <InputField control={form.control} label="ID" name="id" />
        <InputField control={form.control} label="Description" name="description" />
        {permissions && <PermissionListField control={form.control} name="containPermissionIds" permissions={permissions} type="new" />}
      </>
    )}
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