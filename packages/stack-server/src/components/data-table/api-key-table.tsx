'use client';;
import { useState } from "react";
import * as yup from "yup";
import { ApiKeySet, ServerUser } from '@stackframe/stack';
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./elements/column-header";
import { DataTable } from "./elements/data-table";
import { DataTableFacetedFilter } from "./elements/faceted-filter";
import { standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ActionCell, DateCell, TextCell } from "./elements/cells";
import { SearchToolbarItem } from "./elements/toolbar-items";
import { FormDialog } from "../form-dialog";
import { DateField, InputField, SwitchField } from "../form-fields";
import { ActionDialog } from "../action-dialog";
import Typography from "../ui/typography";
import { standardFilterFn } from "./elements/utils";

type ExtendedServerUser = ServerUser & {
  authType: string,
  emailVerified: 'verified' | 'unverified',
};

function toolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="description" placeholder="Filter by description" />
    </>
  );
}

const userFormSchema = yup.object({
  displayName: yup.string(),
  primaryEmail: yup.string().email(),
  signedUpAt: yup.date().required(),
  primaryEmailVerified: yup.boolean().required(),
});

function EditUserDialog(props: { 
  user: ServerUser,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  const defaultValues = {
    displayName: props.user.displayName || undefined,
    primaryEmail: props.user.primaryEmail || undefined,
    primaryEmailVerified: props.user.primaryEmailVerified,
    signedUpAt: props.user.signedUpAt,
  };

  return <FormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Edit User"
    formSchema={userFormSchema}
    defaultValues={defaultValues}
    okButton={{ label: "Save" }}
    render={(form) => (
      <>
        <Typography variant='secondary'>ID: {props.user.id}</Typography>
        <InputField control={form.control} label="Display Name" name="displayName" />
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <InputField control={form.control} label="Primary Email" name="primaryEmail" />
          </div>
          <SwitchField control={form.control} label="Verified" name="primaryEmailVerified" noCard />
        </div>

        <DateField control={form.control} label="Signed Up At" name="signedUpAt" />
      </>
    )}
    onSubmit={async (values) => await props.user.update(values)}
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

const columns: ColumnDef<ApiKeySet>[] =  [
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => <TextCell size={300}>{row.original.description}</TextCell>,
  },
  {
    accessorKey: "clientKey",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client Key" />,
    cell: ({ row }) => <TextCell>*******{row.original.publishableClientKey?.lastFour}</TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "serverKey",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Server Key" />,
    cell: ({ row }) => <TextCell>*******{row.original.secretServerKey?.lastFour}</TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expires At" />,
    cell: ({ row }) => <DateCell date={row.original.expiresAt} />,
  },
];

export function ApiKeyTable(props: { apiKeys: ApiKeySet[] }) {
  return <DataTable data={props.apiKeys} columns={columns} toolbarRender={toolbarRender} />;
}