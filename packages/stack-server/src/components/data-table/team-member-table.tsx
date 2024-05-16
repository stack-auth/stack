'use client';;
import { useEffect, useMemo, useState } from "react";
import { ServerTeam, ServerTeamMember, ServerUser } from '@stackframe/stack';
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { DataTable } from "./elements/data-table";
import { ActionCell } from "./elements/cells";
import { SearchToolbarItem } from "./elements/toolbar-items";
import { ExtendedServerUser, commonUserColumns, extendUsers } from "./user-table";
import { ActionDialog } from "../action-dialog";


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

function TeamMemberActions({ row, team }: { row: Row<ExtendedServerUser>, team: ServerTeam }) {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  return (
    <>
      <RemoveUserDialog user={row.original} open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen} team={team} />
      <ActionCell
        dangerItems={[{
          item: "Remove from team",
          onClick: () => setIsRemoveModalOpen(true),
        }]}
      />
    </>
  );
}

export function TeamMemberTable(props: { members: ServerTeamMember[], team: ServerTeam }) {
  const teamMemberColumns: ColumnDef<ExtendedServerUser>[] = [
    ...commonUserColumns,
    {
      id: "actions",
      cell: ({ row }) => <TeamMemberActions row={row} team={props.team} />,
    },
  ];

  // TODO: Optimize this
  const [users, setUsers] = useState<ServerUser[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({});

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
  }, [props.members, props.team]);

  return <DataTable 
    data={extendedUsers}
    columns={teamMemberColumns} 
    toolbarRender={teamMemberToolbarRender} 
    defaultVisibility={{ emailVerified: false }} 
  />;
}