'use client';
import { useMemo, useState } from "react";
import * as yup from "yup";
import { ServerTeam } from '@stackframe/stack';
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./elements/column-header";
import { DataTable } from "./elements/data-table";
import { ActionCell, DateCell, TextCell } from "./elements/cells";
import { SearchToolbarItem } from "./elements/toolbar-items";
import { FormDialog } from "../form-dialog";
import { InputField } from "../form-fields";
import { ActionDialog } from "../action-dialog";
import Typography from "../ui/typography";
import { useRouter } from "@/components/router";
import { useAdminApp } from "@/app/(main)/(protected)/projects/[projectId]/use-admin-app";

function toolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="displayName" placeholder="Filter by name" />
    </>
  );
}

const teamFormSchema = yup.object({
  displayName: yup.string(),
});

function EditDialog(props: { 
  team: ServerTeam,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  const defaultValues = {
    displayName: props.team.displayName,
  };

  return <FormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Edit Team"
    formSchema={teamFormSchema}
    defaultValues={defaultValues}
    okButton={{ label: "Save" }}
    render={(form) => (
      <>
        <Typography variant='secondary'>ID: {props.team.id}</Typography>
        <InputField control={form.control} label="Display Name" name="displayName" />
      </>
    )}
    onSubmit={async (values) => await props.team.update(values)}
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
    {`Are you sure you want to delete the team "${props.team.displayName}" with ID ${props.team.id}?`}
  </ActionDialog>;
}

function Actions({ row }: { row: Row<ServerTeam> }) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const adminApp = useAdminApp();

  return (
    <>
      <EditDialog team={row.original} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      <DeleteDialog team={row.original} open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} />
      <ActionCell
        items={[
          {
            item: "View Members",
            onClick: () => router.push(`/projects/${adminApp.projectId}/teams/${row.original.id}`),
          },
          {
            item: "Edit",
            onClick: () => setIsEditModalOpen(true),
          }
        ]}
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
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="ID" />,
    cell: ({ row }) => <TextCell size={60}>{row.getValue("id")}</TextCell>,
  },
  {
    accessorKey: "displayName",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Display Name" />,
    cell: ({ row }) => <TextCell size={200}>{row.getValue("displayName")}</TextCell>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Created At" />,
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
