'use client';
import { useEffect, useMemo, useState } from "react";
import * as yup from "yup";
import { ServerTeam, ServerTeamMember, ServerUser } from '@stackframe/stack';
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { DataTable } from "./elements/data-table";
import { ActionCell, BadgeCell } from "./elements/cells";
import { SearchToolbarItem } from "./elements/toolbar-items";
import { ExtendedServerUser, getCommonUserColumns, extendUsers } from "./user-table";
import { ActionDialog } from "../action-dialog";
import { DataTableColumnHeader } from "./elements/column-header";
import { SimpleTooltip } from "../simple-tooltip";
import { PermissionListField } from "../permission-field";
import { useAdminApp } from "@/app/(main)/(protected)/projects/[projectId]/use-admin-app";
import { SmartFormDialog } from "../form-dialog";


type ExtendedServerUserForTeam = ExtendedServerUser & {
  permissions: string[],
};

function teamMemberToolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="primaryEmail" placeholder="Filter by email" />
    </>
  );
}

function RemoveUserDialog(props: {
  team: ServerTeam,
  user: ServerUser,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  return <ActionDialog
    title
    danger
    open={props.open}
    onOpenChange={props.onOpenChange}
    okButton={{
      label: "Remove user from team",
      onClick: async () => { await props.team.removeUser(props.user.id); }
    }}
    cancelButton
    confirmText="I understand this will cause the user to lose access to the team."
  >
    {`Are you sure you want to remove the user "${props.user.displayName}" from the team "${props.team.displayName}"?`}
  </ActionDialog>;
}

function EditPermissionDialog(props: {
  user: ExtendedServerUserForTeam,
  team: ServerTeam,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onSubmit: () => void,
}) {
  const stackAdminApp = useAdminApp();
  const permissions = stackAdminApp.usePermissionDefinitions();

  const formSchema = yup.object({
    permissions: yup.array().of(yup.string().required()).required().meta({
      stackFormFieldRender: (innerProps) => (
        <PermissionListField
          {...innerProps}
          permissions={permissions} 
          type="edit-user"
          team={props.team}
          user={props.user}
        />
      ),
    }),
  }).default({ permissions: props.user.permissions });

  return <SmartFormDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Edit Permission"
    formSchema={formSchema}
    okButton={{ label: "Save" }}
    onSubmit={async (values) => {
      const promises = permissions.map(p => {
        if (values.permissions.includes(p.id)) {
          return props.user.grantPermission(props.team, p.id);
        } else {
          return props.user.revokePermission(props.team, p.id);
        }
      });
      await Promise.all(promises);
      props.onSubmit();
    }}
    cancelButton
  />;
}


function Actions(
  { row, team, setUpdateCounter }: 
  { row: Row<ExtendedServerUserForTeam>, team: ServerTeam, setUpdateCounter: (c: (v: number) => number) => void }
) {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <RemoveUserDialog 
        user={row.original} 
        team={team} 
        open={isRemoveModalOpen} 
        onOpenChange={setIsRemoveModalOpen} 
      />
      <EditPermissionDialog 
        user={row.original} 
        team={team} 
        open={isEditModalOpen} 
        onOpenChange={(v) => setIsEditModalOpen(v)}
        onSubmit={() => setUpdateCounter(c => c + 1)} 
      />
      <ActionCell
        items={[{
          item: "Edit permissions",
          onClick: () => setIsEditModalOpen(true),
        }]}
        dangerItems={[{
          item: "Remove from team",
          onClick: () => setIsRemoveModalOpen(true),
        }]}
      />
    </>
  );
}

export function TeamMemberTable(props: { members: ServerTeamMember[], team: ServerTeam }) {
  const teamMemberColumns: ColumnDef<ExtendedServerUserForTeam>[] = [
    ...getCommonUserColumns<ExtendedServerUserForTeam>(),
    {
      accessorKey: "permissions",
      header: ({ column }) => <DataTableColumnHeader
        column={column}
        columnTitle={<div className="flex items-center gap-1">
          Permissions
          <SimpleTooltip tooltip="Only showing direct permissions" type='info' />
        </div>}
      />,
      cell: ({ row }) => <BadgeCell size={120} badges={row.getValue("permissions")} />,
    },
    {
      id: "actions",
      cell: ({ row }) => <Actions row={row} team={props.team} setUpdateCounter={setUpdateCounter} />,
    },
  ];

  // TODO: Optimize this
  const [users, setUsers] = useState<ServerUser[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({});
  const [updateCounter, setUpdateCounter] = useState(0);

  const extendedUsers: ExtendedServerUserForTeam[] = useMemo(() => {
    return extendUsers(users).map((user) => ({
      ...user,
      permissions: userPermissions[user.id] || [],
    }));
  }, [users, userPermissions]);
  
  useEffect(() => {
    async function load() {
      const promises = props.members.map(async member => {
        const user = await member.getUser();
        const permissions = await user.listPermissions(props.team, { direct: true });
        return {
          user,
          permissions,
        };
      });
      return await Promise.all(promises);
    }
    
    load().then((data) => {
      setUserPermissions(Object.fromEntries(
        props.members.map((member, index) => [member.userId, data[index].permissions.map(p => p.id)])
      ));
      setUsers(data.map(d => d.user));
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.members, props.team, updateCounter]);

  return <DataTable 
    data={extendedUsers}
    columns={teamMemberColumns} 
    toolbarRender={teamMemberToolbarRender} 
    defaultVisibility={{ emailVerified: false }} 
  />;
}