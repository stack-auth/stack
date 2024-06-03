"use client";
import React from "react";
import * as yup from "yup";
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { Alert } from "@/components/ui/alert";
import { StyledLink } from "@/components/link";
import { UserTable } from "@/components/data-table/user-table";
import { Button } from "@/components/ui/button"
import { SmartFormDialog } from "@/components/form-dialog";
import { ActionDialog } from "@/components/action-dialog";
import Typography from "@/components/ui/typography";


type CreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opennotification: Function
};

export default function PageClient() {

  const stackAdminApp = useAdminApp();
  const allUsers = stackAdminApp.useServerUsers();
  const [addUserOpen, setAddUserOpen] = React.useState(false);
  const [notifyPassword, setNotifyPassword] = React.useState(false);
 console.log(notifyPassword)
  const handlePasswordNotificationClose = async () => {
    setNotifyPassword(false);
  };
  return (
    <PageLayout
      title="Users"
      actions={
        <Button onClick={() => setAddUserOpen(true)}>
          Create users
        </Button>
      }>
      {allUsers.length > 0 ? null : (
        <Alert variant='success'>
          Congratulations on starting your project! Check the <StyledLink href="https://docs.stack-auth.com">documentation</StyledLink> to add your first users.
        </Alert>
      )}
      <UserTable users={allUsers} />
      <CreateDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        opennotification={setNotifyPassword}
      />
      <ActionDialog
        title="Password Change Required"
        okButton={{
          label: "Change Password Soon",
          onClick: handlePasswordNotificationClose,
        }}
        open={notifyPassword}
        onClose={() => setNotifyPassword(false)}
      >
        <div className="flex flex-col gap-2">
          <Typography className="mb-4">
            Please change your password soon to ensure account security.
          </Typography>
        </div>
      </ActionDialog>
    </PageLayout>
  );
}
function CreateDialog({ open, onOpenChange, opennotification }: CreateDialogProps) {
  const stackAdminApp = useAdminApp();

  const formSchema = yup.object({
    email: yup.string().required().label("Email"),
  });

  const handleCreateUser = async (values: { email: any }) => {
    await stackAdminApp.createUser({
      email: values.email,
    });
    opennotification(true);
    
  };

  return (
    <>
      <SmartFormDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Create a User"
        formSchema={formSchema}
        okButton={{ label: "Create User" }}
        onSubmit={handleCreateUser}
        cancelButton
      />
    </>
  );
}


