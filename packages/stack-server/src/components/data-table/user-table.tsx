'use client';;
import { useEffect, useMemo, useState } from "react";
import * as yup from "yup";
import { ServerPermission, ServerTeam, ServerTeamMember, ServerUser } from '@stackframe/stack';
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
import { standardFilterFn } from "./elements/utils";

type ExtendedServerUser = ServerUser & {
  authType: string,
  emailVerified: 'verified' | 'unverified',
};

type ExtendedServerUserForTeam = ExtendedServerUser & {
  permissions: string[],
};

function userToolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="primaryEmail" placeholder="Filter by email" />
      <DataTableFacetedFilter
        column={table.getColumn("authType")}
        title="Auth Method"
        options={['email', ...standardProviders].map((provider) => ({
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

function teamMemberToolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="primaryEmail" placeholder="Filter by email" />
    </>
  );
}

const userEditFormSchema = yup.object({
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
    formSchema={userEditFormSchema}
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

function UserActions({ row }: { row: Row<ExtendedServerUser> }) {
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

const commonColumns: ColumnDef<ExtendedServerUser>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => <TextCell size={60}>{row.original.id}</TextCell>,
  },
  {
    accessorKey: "profileImageUrl",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Avatar" />,
    cell: ({ row }) => <AvatarCell src={row.original.profileImageUrl || undefined} />,
    enableSorting: false,
  },
  {
    accessorKey: "displayName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Display Name" />,
    cell: ({ row }) => <TextCell size={120}>{row.original.displayName}</TextCell>,
  },
  {
    accessorKey: "primaryEmail",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Primary Email" />,
    cell: ({ row }) => <TextCell size={180}>{row.original.primaryEmail}</TextCell>,
  },
];

const userColumns: ColumnDef<ExtendedServerUser>[] =  [
  ...commonColumns,
  {
    accessorKey: "emailVerified",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email Verified" />,
    cell: ({ row }) => <BadgeCell badges={[row.original.emailVerified === 'verified' ? '✓' : '✗']} />,
    filterFn: standardFilterFn
  },
  {
    accessorKey: "authType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Auth Method" />,
    cell: ({ row }) => <BadgeCell badges={[row.original.authType]} />,
    filterFn: standardFilterFn,
  },
  {
    accessorKey: "signedUpAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Signed Up At" />,
    cell: ({ row }) => <DateCell date={row.original.signedUpAt} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions row={row} />,
  },
];

const teamMemberColumns: ColumnDef<ExtendedServerUser>[] = [
  ...commonColumns,
];

function extendUsers(users: ServerUser[]): ExtendedServerUser[] {
  return users.map((user) => ({
    ...user,
    authType: (user.authWithEmail ? "email" : user.oauthProviders[0]) || "",
    emailVerified: user.primaryEmailVerified ? "verified" : "unverified",
  }));
}


export function UserTable(props: { users: ServerUser[] }) {
  const extendedUsers: ExtendedServerUser[] = useMemo(() => extendUsers(props.users), [props.users]);
  return <DataTable data={extendedUsers} columns={userColumns} toolbarRender={userToolbarRender} />;
}

export function TeamMemberTable(props: { members: ServerTeamMember[], team: ServerTeam }) {
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

  return <DataTable data={extendedUsers} columns={teamMemberColumns} toolbarRender={teamMemberToolbarRender} />;
}