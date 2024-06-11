"use client";
import React, { useState } from "react";
import * as yup from "yup";
import { useAdminApp } from "../use-admin-app";
import { PageLayout } from "../page-layout";
import { Alert } from "@/components/ui/alert";
import { StyledLink } from "@/components/link";
import { UserTable } from "@/components/data-table/user-table";
import { Button } from "@/components/ui/button";
import { SmartFormDialog } from "@/components/form-dialog";
import { ActionDialog } from "@/components/action-dialog";
import Typography from "@/components/ui/typography";


type CreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setShowNotifyPasswordDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setcurrentUserPassword: React.Dispatch<React.SetStateAction<string>>;

};

export default function PageClient() {
  const stackAdminApp = useAdminApp();
  const allUsers = stackAdminApp.useServerUsers();
  const [addUserOpen, setAddUserOpen] = React.useState(false);
  const [showNotifyPasswordDialog, setShowNotifyPasswordDialog] = React.useState(false);
  const [currentUserPassword, setcurrentUserPassword] = React.useState("");


  const handlePasswordNotificationClose = async () => {
    setShowNotifyPasswordDialog(false);
  };

  return (
    <PageLayout
      title="Users"
      actions={
        <Button onClick={() => setAddUserOpen(true)}>Create users</Button>
      }
    >
      {allUsers.length > 0 ? null : (
        <Alert variant="success">
          Congratulations on starting your project! Check the{" "}
          <StyledLink href="https://docs.stack-auth.com">
            documentation
          </StyledLink>{" "}
          to add your first users.
        </Alert>
      )}
      <UserTable users={allUsers} />
      <CreateDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        setShowNotifyPasswordDialog={setShowNotifyPasswordDialog}
        setcurrentUserPassword={setcurrentUserPassword}
      />
      <ActionDialog
        title="Password Change Required"
        okButton={{
          label: "Change Password Soon",
          onClick: handlePasswordNotificationClose,
        }}
        open={showNotifyPasswordDialog}
        onClose={handlePasswordNotificationClose}
      >
        <div className="flex flex-col gap-2">
          <Typography className="mb-4">
            Please change your password soon to ensure account security.
          </Typography>
          <Typography className="mb-4">
           Your Current Password:  {currentUserPassword}
          </Typography>
        </div>
      </ActionDialog>
    </PageLayout>
  );
}

function CreateDialog({ open, onOpenChange, setShowNotifyPasswordDialog,setcurrentUserPassword }: CreateDialogProps) {
  const stackAdminApp = useAdminApp();

  const formSchema = yup.object({
    email: yup.string().required().label("Email"),
  });

  const handleCreateUser = async (values: { email: string }) => {
   const res=  await stackAdminApp.createUserWithCredential({
      email: values.email,
    });
    if (typeof res === 'string') {
      setcurrentUserPassword(res);
      setShowNotifyPasswordDialog(true);
    } else {
      console.error('Unexpected response:', res);
    }

  };

  return (
    <SmartFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create a User"
      formSchema={formSchema}
      okButton={{ label: "Create User" }}
      onSubmit={handleCreateUser}
      cancelButton
    />
  );
}