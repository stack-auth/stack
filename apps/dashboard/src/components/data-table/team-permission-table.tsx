'use client';
import { useAdminApp } from "@/app/(main)/(protected)/projects/[projectId]/use-admin-app";
import { AdminTeamPermissionDefinition } from "@stackframe/stack";
import { ActionCell, ActionDialog, BadgeCell, DataTable, DataTableColumnHeader, SearchToolbarItem, SimpleTooltip, TextCell } from "@stackframe/stack-ui";
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { useState } from "react";
import * as yup from "yup";
import { SmartFormDialog } from "../form-dialog";
import { PermissionListField } from "../permission-field";

function toolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="id" placeholder="Filter by ID" />
    </>
  );
}

function EditDialog(props: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  selectedPermissionId: string,
}) {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.useTeamPermissionDefinitions();
  const currentPermission = permissions.find((p) => p.id === props.selectedPermissionId);
  if (!currentPermission) {
    return null;
  }

  const formSchema = yup.object({
    id: yup.string()
      .defined()
      .notOneOf(permissions.map((p) => p.id).filter(p => p !== props.selectedPermissionId), "ID already exists")
      .matches(/^[a-z0-9_:]+$/, 'Only lowercase letters, numbers, ":" and "_" are allowed')
      .label("ID"),
    description: yup.string().label("Description"),
    containedPermissionIds: yup.array().of(yup.string().defined()).defined().meta({
      stackFormFieldRender: (innerProps) => (
        <PermissionListField
          {...innerProps}
          permissions={permissions.map((p) => ({
            id: p.id,
            description: p.description,
            containedPermissionIds: p.containedPermissionIds,
          }))}
          type="edit"
          selectedPermissionId={props.selectedPermissionId}
        />
      ),
    })
  }).default(currentPermission);

  return <SmartFormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Edit Permission"
    formSchema={formSchema}
    okButton={{ label: "Save" }}
    onSubmit={async (values) => {
      await stackAdminApp.updateTeamPermissionDefinition(props.selectedPermissionId, values);
    }}
    cancelButton
  />;
}

function DeleteDialog(props: {
  permission: AdminTeamPermissionDefinition,
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
    okButton={{ label: "Delete Permission", onClick: async () => { await stackApp.deleteTeamPermissionDefinition(props.permission.id); } }}
    confirmText="I understand this will remove the permission from all users and other permissions that contain it."
  >
    {`Are you sure you want to delete the permission "${props.permission.id}"?`}
  </ActionDialog>;
}

function Actions({ row, invisible }: { row: Row<AdminTeamPermissionDefinition>, invisible: boolean }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className={`flex items-center gap-2 ${invisible ? "invisible" : ""}`}>
      <EditDialog selectedPermissionId={row.original.id} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      <DeleteDialog permission={row.original} open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} />
      <ActionCell
        items={[
          {
            item: "Edit",
            onClick: () => setIsEditModalOpen(true),
          },
          '-',
          {
            item: "Delete",
            danger: true,
            onClick: () => setIsDeleteModalOpen(true),
          }
        ]}
      />
    </div>
  );
}

const columns: ColumnDef<AdminTeamPermissionDefinition>[] =  [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="ID" />,
    cell: ({ row }) => <TextCell size={160}>
      <div className="flex items-center gap-1">
        {row.original.id}
        {row.original.id.startsWith('$') ?
          <SimpleTooltip tooltip="Built-in system permissions are prefixed with $. They cannot be edited or deleted, but can be contained in other permissions." type='info'/>
          : null}
      </div>
    </TextCell>,
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Description" />,
    cell: ({ row }) => <TextCell size={200}>{row.getValue("description")}</TextCell>,
  },
  {
    accessorKey: "containedPermissionIds",
    header: ({ column }) => <DataTableColumnHeader
      column={column}
      columnTitle={<div className="flex items-center gap-1">
        Contained Permissions
        <SimpleTooltip tooltip="Only showing permissions that are contained directly (non-recursive)." type='info' />
      </div>}
    />,
    cell: ({ row }) => <BadgeCell size={120} badges={row.original.containedPermissionIds} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions row={row} invisible={row.original.id.startsWith('$')} />,
  },
];

export function TeamPermissionTable(props: { permissions: AdminTeamPermissionDefinition[] }) {
  return <DataTable
    data={props.permissions}
    columns={columns}
    toolbarRender={toolbarRender}
    defaultColumnFilters={[]}
    defaultSorting={[]}
  />;
}
