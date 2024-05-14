'use client';;
import { useMemo, useState } from "react";
import * as yup from "yup";
import { ServerTeam, ServerUser } from '@stackframe/stack';
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./elements/column-header";
import { DataTable } from "./elements/data-table";
import { DataTableFacetedFilter } from "./elements/faceted-filter";
import { standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ActionCell, AvatarCell, BadgeCell, DateCell, TextCell } from "./elements/cells";
import { SearchToolbarItem } from "./elements/toolbar-items";
import { FormDialog } from "../form-dialog";
import { DateField, InputField, SwitchField } from "../form-fields";
import { ActionDialog } from "../action-dialog";
import Typography from "../ui/typography";
import { CircleCheck, CircleX } from "lucide-react";
import { standardFilterFn } from "./elements/utils";

function toolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="displayName" placeholder="Filter by name" />
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

function DeleteDialog(props: {
  team: ServerTeam,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  return <ActionDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Delete Team"
    danger
    cancelButton
    okButton={{ label: "Delete Team", onClick: async () => { await props.team.delete(); } }}
    confirmText="I understand that this action cannot be undone and all the team members will be also removed from the team."
  >
    {`Are you sure you want to delete the team ${props.team.displayName ? '"' + props.team.displayName + '"' : ''} with ID ${props.team.id}?`}
  </ActionDialog>;
}

function Actions({ row }: { row: Row<ServerTeam> }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  return (
    <>
      {/* <EditUserDialog user={row.original} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} /> */}
      <DeleteDialog team={row.original} open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} />
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

const columns: ColumnDef<ServerTeam>[] =  [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => <TextCell size={60}>{row.getValue("id")}</TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "displayName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Display Name" />,
    cell: ({ row }) => <TextCell size={200}>{row.getValue("displayName")}</TextCell>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => <DateCell date={row.getValue("createdAt")}></DateCell>,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions row={row} />,
  },
];

export function TeamTable(props: { teams: ServerTeam[] }) {
  return <DataTable data={props.teams} columns={columns} toolbarRender={toolbarRender} />;
}