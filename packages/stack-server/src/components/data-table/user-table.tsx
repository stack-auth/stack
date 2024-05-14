'use client';;
import { useMemo } from "react";
import { ServerUser } from '@stackframe/stack';
import { ColumnDef, Table } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./elements/column-header";
import { DataTable } from "./elements/data-table";
import { DataTableFacetedFilter } from "./elements/faceted-filter";
import { standardProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { ActionCell, AvatarCell, BadgeCell, DateCell, TextCell } from "./elements/cells";
import { SearchToolbarItem } from "./elements/toolbar-items";

export function toolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} key="primaryEmail" placeholder="Filter by primary email" />
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

type ExtendedServerUser = ServerUser & {
  authType: string,
};

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
    cell: ({ row }) => <ActionCell dangerItems={['delete']}/>,
  },
];

export function UserTable(props: { users: ServerUser[] }) {
  const extendedUsers: ExtendedServerUser[] = useMemo(() => props.users.map((user) => ({
    ...user,
    authType: (user.authWithEmail ? "email" : user.oauthProviders[0]) || ""
  })), [props.users]);

  return <DataTable data={extendedUsers} columns={columns} toolbarRender={toolbarRender} />;
}