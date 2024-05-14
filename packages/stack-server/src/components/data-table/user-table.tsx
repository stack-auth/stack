'use client';

import React from "react";
import { ServerUser } from '@stackframe/stack';
import { ColumnDef, Row } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./elements/data-table-column-header";
import { DataTable } from "./elements/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Checkbox } from "../ui/checkbox";


function TextCell(props: { children: React.ReactNode, size: number }) {
  return (
    <div className="text-ellipsis text-nowrap overflow-x-hidden" style={{ width: props.size }}>
      {props.children}
    </div>
  );
};

function AvatarCell(props: { displayName?: string, src?: string }) {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={props.src} alt={props.displayName} />
      <AvatarFallback>{(props.displayName || "").slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function DateCell(props: { date: Date }) {
  return (
    <TextCell size={140}>
      {props.date.toLocaleTimeString([], {year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
    </TextCell>
  );
}

const columns: ColumnDef<ServerUser>[] =  [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => <TextCell size={60}>{row.getValue("id")}</TextCell>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "profileImageUrl",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Avatar" />
    ),
    cell: ({ row }) => <AvatarCell src={row.getValue("profileImageUrl")} displayName={row.getValue("displayName")} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "displayName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Display Name" />
    ),
    cell: ({ row }) => <TextCell size={120}>{row.getValue("displayName")}</TextCell>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "primaryEmail",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Primary Email" />
    ),
    cell: ({ row }) => <TextCell size={180}>{row.getValue("primaryEmail")}</TextCell>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "signedUpAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Signed Up At" />
    ),
    cell: ({ row }) => <DateCell date={row.getValue("signedUpAt")} />,
    enableSorting: false,
    enableHiding: false,
  },
];

export function UserTable(props: { users: ServerUser[] }) {
  return (<DataTable data={props.users} columns={columns}  />);
}