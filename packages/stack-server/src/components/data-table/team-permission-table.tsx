'use client';;
import { useState } from "react";
import * as yup from "yup";
import { ServerTeam, useStackApp } from '@stackframe/stack';
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./elements/column-header";
import { DataTable } from "./elements/data-table";
import { ActionCell, BadgeCell, DateCell, TextCell } from "./elements/cells";
import { SearchToolbarItem } from "./elements/toolbar-items";
import { FormDialog } from "../form-dialog";
import { InputField } from "../form-fields";
import { ActionDialog } from "../action-dialog";
import Typography from "../ui/typography";
import { useRouter } from "next/navigation";
import { useAdminApp } from "@/app/(main)/(protected)/projects/[projectId]/use-admin-app";
import { PermissionDefinitionJson } from "@stackframe/stack-shared/dist/interface/clientInterface";

function toolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="id" placeholder="Filter by ID" />
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
  permission: PermissionDefinitionJson,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  const stackApp = useAdminApp();
  return <ActionDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Delete Permission"
    danger
    cancelButton
    okButton={{ label: "Delete Permission", onClick: async () => { await stackApp.deletePermissionDefinition(props.permission.id); } }}
    confirmText="I understand this will remove the permission from all users and other permissions that contain it."
  >
    {`Are you sure you want to delete the permission "${props.permission.id}"?`}
  </ActionDialog>;
}

function Actions({ row }: { row: Row<PermissionDefinitionJson> }) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const adminApp = useAdminApp();

  return (
    <>
      {/* <EditDialog team={row.original} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} /> */}
      <DeleteDialog permission={row.original} open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} />
      <ActionCell
        items={[
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

const columns: ColumnDef<PermissionDefinitionJson>[] =  [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => <TextCell size={60}>{row.getValue("id")}</TextCell>,
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => <TextCell size={200}>{row.getValue("description")}</TextCell>,
  },
  {
    accessorKey: "containPermissionIds",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contain Permissions" />,
    cell: ({ row }) => <BadgeCell size={120} badges={row.getValue("containPermissionIds")} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions row={row} />,
  },
];

export function TeamPermissionTable(props: { permissions: PermissionDefinitionJson[] }) {
  return <DataTable data={props.permissions} columns={columns} toolbarRender={toolbarRender} />;
}