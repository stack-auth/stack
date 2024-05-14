'use client';;
import { useMemo, useState } from "react";
import * as yup from "yup";
import { ServerUser } from '@stackframe/stack';
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./elements/column-header";
import { DataTable } from "./elements/data-table";
import { DataTableFacetedFilter } from "./elements/faceted-filter";
import { standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ActionCell, AvatarCell, BadgeCell, DateCell, TextCell } from "./elements/cells";
import { SearchToolbarItem } from "./elements/toolbar-items";
import { FormDialog } from "../form-dialog";
import { InputField } from "../form-fields";
import { ActionDialog } from "../action-dialog";

type ExtendedServerUser = ServerUser & {
  authType: string,
};

function toolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="primaryEmail" placeholder="Filter by primary email" />
      <DataTableFacetedFilter
        column={table.getColumn("authType")}
        title="Auth Method"
        options={['email', ...standardProviders].map((provider) => ({
          value: provider,
          label: provider,
        }))}
      />
    </>
  );
}

const userFormSchema = yup.object({
  displayName: yup.string(),
});

function EditUserDialog(props: { 
  user: ServerUser,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  const defaultValues = {
    displayName: props.user.displayName || undefined,
  };
  return <FormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Edit User"
    formSchema={userFormSchema}
    defaultValues={defaultValues}
    render={(form) => (
      <>
        <InputField control={form.control} label="Display Name" name="displayName" />
      </>
    )}
    onSubmit={async (values) => {
      await props.user.update(values);
      props.onOpenChange(false);
    }}
    cancelButton
  />;
}

function DeleteUserDialog(props: {
  user: ServerUser,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  return <ActionDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Delete User"
    danger
    cancelButton
    okButton={{ label: "Delete User", onClick: async () => { await props.user.delete(); } }}
    confirmText="I understand that this action cannot be undone."
  >
    {`Are you sure you want to delete the user ${props.user.displayName ? '"' + props.user.displayName + '"' : ''} with ID ${props.user.id}?`}
  </ActionDialog>;
}

function Actions({ row }: { row: Row<ExtendedServerUser> }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  return (
    <>
      <EditUserDialog user={row.original} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      <DeleteUserDialog user={row.original} open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} />
      <ActionCell
        items={[{
          item: "Edit",
          onClick: () => setIsEditModalOpen(true),
        }]}
        dangerItems={[{
          item: "Delete",
          onClick: () => setIsDeleteModalOpen(true),
        }]}
      />
    </>
  );
}

const columns: ColumnDef<ExtendedServerUser>[] =  [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => <TextCell size={60}>{row.getValue("id")}</TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "profileImageUrl",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Avatar" />,
    cell: ({ row }) => <AvatarCell src={row.getValue("profileImageUrl")} />,
    enableSorting: false,
  },
  {
    accessorKey: "displayName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Display Name" />,
    cell: ({ row }) => <TextCell size={120}>{row.getValue("displayName")}</TextCell>,
  },
  {
    accessorKey: "primaryEmail",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Primary Email" />,
    cell: ({ row }) => <TextCell size={180}>{row.getValue("primaryEmail")}</TextCell>,
  },
  {
    accessorKey: "authType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Auth Method" />,
    cell: ({ row }) => <BadgeCell badges={[row.getValue("authType")]} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "signedUpAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Signed Up At" />,
    cell: ({ row }) => <DateCell date={row.getValue("signedUpAt")} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions row={row} />,
  },
];

export function UserTable(props: { users: ServerUser[] }) {
  const extendedUsers: ExtendedServerUser[] = useMemo(() => props.users.map((user) => ({
    ...user,
    authType: (user.authWithEmail ? "email" : user.oauthProviders[0]) || ""
  })), [props.users]);

  return <DataTable data={extendedUsers} columns={columns} toolbarRender={toolbarRender} />;
}