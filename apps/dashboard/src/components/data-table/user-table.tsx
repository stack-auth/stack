"use client";

import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import * as yup from "yup";
import { ServerUser } from "@stackframe/stack";
import { jsonStringOrEmptySchema } from "@stackframe/stack-shared/dist/schema-fields";
import { allProviders } from "@stackframe/stack-shared/dist/utils/oauth";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";
import {
  ActionCell,
  ActionDialog,
  AvatarCell,
  BadgeCell,
  CopyField,
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DateCell,
  SearchToolbarItem,
  SimpleTooltip,
  TextCell,
  Typography,
  arrayFilterFn,
  standardFilterFn,
} from "@stackframe/stack-ui";
import { useAdminApp } from "@/app/(main)/(protected)/projects/[projectId]/use-admin-app";
import { FormDialog } from "../form-dialog";
import { DateField, InputField, SwitchField, TextAreaField } from "../form-fields";

export type ExtendedServerUser = ServerUser & {
  authTypes: string[];
  emailVerified: "verified" | "unverified";
};

function userToolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} placeholder="Search table" />
      <DataTableFacetedFilter
        column={table.getColumn("authTypes")}
        title="Auth Method"
        options={["email", "password", ...allProviders].map((provider) => ({
          value: provider,
          label: provider,
        }))}
      />
      <DataTableFacetedFilter
        column={table.getColumn("emailVerified")}
        title="Email Verified"
        options={[
          { value: "verified", label: "verified" },
          { value: "unverified", label: "unverified" },
        ]}
      />
    </>
  );
}

const userEditFormSchema = yup.object({
  displayName: yup.string(),
  primaryEmail: yup.string().email("Primary Email must be a valid email address"),
  signedUpAt: yup.date().required(),
  primaryEmailVerified: yup.boolean().required(),
  clientMetadata: jsonStringOrEmptySchema.default("null"),
  serverMetadata: jsonStringOrEmptySchema.default("null"),
});

function EditUserDialog(props: { user: ServerUser; open: boolean; onOpenChange: (open: boolean) => void }) {
  const defaultValues = {
    displayName: props.user.displayName || undefined,
    primaryEmail: props.user.primaryEmail || undefined,
    primaryEmailVerified: props.user.primaryEmailVerified,
    signedUpAt: props.user.signedUpAt,
    clientMetadata: props.user.clientMetadata == null ? "" : JSON.stringify(props.user.clientMetadata, null, 2),
    serverMetadata: props.user.serverMetadata == null ? "" : JSON.stringify(props.user.serverMetadata, null, 2),
  };

  return (
    <FormDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Edit User"
      formSchema={userEditFormSchema}
      defaultValues={defaultValues}
      okButton={{ label: "Save" }}
      render={(form) => (
        <>
          <Typography variant="secondary">ID: {props.user.id}</Typography>
          <InputField control={form.control} label="Display Name" name="displayName" />

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <InputField control={form.control} label="Primary Email" name="primaryEmail" />
            </div>
            <div className="mb-2">
              <SwitchField control={form.control} label="Verified" name="primaryEmailVerified" />
            </div>
          </div>

          <DateField control={form.control} label="Signed Up At" name="signedUpAt" />

          <TextAreaField rows={3} control={form.control} label="Client Metadata" name="clientMetadata" placeholder="null" monospace />
          <TextAreaField rows={3} control={form.control} label="Server Metadata" name="serverMetadata" placeholder="null" monospace />
        </>
      )}
      onSubmit={async (values) => {
        await props.user.update({
          ...values,
          clientMetadata: values.clientMetadata ? JSON.parse(values.clientMetadata) : undefined,
          serverMetadata: values.serverMetadata ? JSON.parse(values.serverMetadata) : undefined,
        });
      }}
      cancelButton
    />
  );
}

function DeleteUserDialog(props: { user: ServerUser; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <ActionDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="Delete User"
      danger
      cancelButton
      okButton={{
        label: "Delete User",
        onClick: async () => {
          await props.user.delete();
        },
      }}
      confirmText="I understand that this action cannot be undone."
    >
      {`Are you sure you want to delete the user ${props.user.displayName ? '"' + props.user.displayName + '"' : ""} with ID ${props.user.id}?`}
    </ActionDialog>
  );
}

function ImpersonateUserDialog(props: { user: ServerUser; impersonateSnippet: string | null; onClose: () => void }) {
  return (
    <ActionDialog
      open={props.impersonateSnippet !== null}
      onOpenChange={(open) => !open && props.onClose()}
      title="Impersonate User"
      okButton
    >
      <Typography>Open your website and paste the following code into the browser console:</Typography>
      <CopyField monospace height={60} value={props.impersonateSnippet ?? ""} />
    </ActionDialog>
  );
}

function UserActions({ row }: { row: Row<ExtendedServerUser> }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [impersonateSnippet, setImpersonateSnippet] = useState<string | null>(null);
  const app = useAdminApp();

  return (
    <>
      <EditUserDialog user={row.original} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      <DeleteUserDialog user={row.original} open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} />
      <ImpersonateUserDialog user={row.original} impersonateSnippet={impersonateSnippet} onClose={() => setImpersonateSnippet(null)} />
      <ActionCell
        items={[
          {
            item: "Impersonate",
            onClick: async () => {
              const expiresInMillis = 1000 * 60 * 60 * 2;
              const expiresAtDate = new Date(Date.now() + expiresInMillis);
              const session = await row.original.createSession({ expiresInMillis });
              const tokens = await session.getTokens();
              setImpersonateSnippet(deindent`
                document.cookie = 'stack-refresh-${app.projectId}=${tokens.refreshToken}; expires=${expiresAtDate.toUTCString()}; path=/'; 
                window.location.reload();
              `);
            },
          },
          "-",
          {
            item: "Edit",
            onClick: () => setIsEditModalOpen(true),
          },
          {
            item: "Delete",
            onClick: () => setIsDeleteModalOpen(true),
            danger: true,
          },
        ]}
      />
    </>
  );
}

export const getCommonUserColumns = <T extends ExtendedServerUser>() =>
  [
    {
      accessorKey: "profileImageUrl",
      header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Avatar" />,
      cell: ({ row }) => <AvatarCell src={row.original.profileImageUrl || undefined} />,
      enableSorting: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="ID" />,
      cell: ({ row }) => <TextCell size={60}>{row.original.id}</TextCell>,
      enableGlobalFilter: true,
    },
    {
      accessorKey: "displayName",
      header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Display Name" />,
      cell: ({ row }) => (
        <TextCell size={120}>
          <span className={row.original.displayName === null ? "text-slate-400" : ""}>{row.original.displayName ?? "–"}</span>
        </TextCell>
      ),
      enableGlobalFilter: true,
    },
    {
      accessorKey: "primaryEmail",
      header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Primary Email" />,
      cell: ({ row }) => (
        <TextCell
          size={180}
          icon={row.original.emailVerified === "unverified" && <SimpleTooltip tooltip="Email not verified" type="warning" />}
        >
          {row.original.primaryEmail}
        </TextCell>
      ),
      enableGlobalFilter: true,
    },
    {
      accessorKey: "lastActiveAt",
      header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Last Active" />,
      cell: ({ row }) => <DateCell date={row.original.lastActiveAt} />,
    },
    {
      accessorKey: "emailVerified",
      header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Email Verified" />,
      cell: ({ row }) => <TextCell>{row.original.emailVerified === "verified" ? "✓" : "✗"}</TextCell>,
      filterFn: standardFilterFn,
      enableGlobalFilter: false,
    },
  ] satisfies ColumnDef<T>[];

const columns: ColumnDef<ExtendedServerUser>[] = [
  ...getCommonUserColumns<ExtendedServerUser>(),
  {
    accessorKey: "authTypes",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Auth Method" />,
    cell: ({ row }) => <BadgeCell badges={row.original.authTypes} />,
    filterFn: arrayFilterFn,
  },
  {
    accessorKey: "signedUpAt",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Signed Up At" />,
    cell: ({ row }) => <DateCell date={row.original.signedUpAt} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions row={row} />,
  },
];

export function extendUsers(users: ServerUser[]): ExtendedServerUser[] {
  return users
    .map(
      (user) =>
        ({
          ...user,
          authTypes: [
            ...(user.emailAuthEnabled ? ["email"] : []),
            ...(user.hasPassword ? ["password"] : []),
            ...user.oauthProviders.map((p) => p.id),
          ],
          emailVerified: user.primaryEmailVerified ? "verified" : "unverified",
        }) satisfies ExtendedServerUser,
    )
    .sort((a, b) => (a.signedUpAt > b.signedUpAt ? -1 : 1));
}

export function UserTable(props: { users: ServerUser[] }) {
  const extendedUsers: ExtendedServerUser[] = useMemo(() => extendUsers(props.users), [props.users]);
  return (
    <DataTable data={extendedUsers} columns={columns} toolbarRender={userToolbarRender} defaultVisibility={{ emailVerified: false }} />
  );
}
