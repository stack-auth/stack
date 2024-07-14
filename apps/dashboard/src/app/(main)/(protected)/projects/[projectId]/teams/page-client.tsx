"use client";
import React from "react";
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { TeamTable } from "@/components/data-table/team-table";
import { Button } from "@/components/ui/button";
import { SmartFormDialog } from "@/components/form-dialog";
import * as yup from "yup";

type CreateDialogProps = {
  open: boolean,
  onOpenChange: (open: boolean) => void,
};

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const teams = stackAdminApp.useTeams();

  const [createTeamsOpen, setCreateTeamsOpen] = React.useState(false);

  return (
    <PageLayout
      title="Teams"
      actions={
        <Button onClick={() => setCreateTeamsOpen(true)}>
          Create Team
        </Button>
      }>
      <TeamTable teams={teams} />
      <CreateDialog
        open={createTeamsOpen}
        onOpenChange={setCreateTeamsOpen}
      />
    </PageLayout>
  );
}

function CreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const stackAdminApp = useAdminApp();


  const formSchema = yup.object({
    displayName: yup.string().required().label("Display Name"),
  });

  return (
    <SmartFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create a Team"
      formSchema={formSchema}
      okButton={{ label: "Create" }}
      onSubmit={async (values) => {
        await stackAdminApp.createTeam({
          displayName: values.displayName,
        });
      }}
      cancelButton
    />
  );
}
