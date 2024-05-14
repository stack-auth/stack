'use client';

import React from "react";
import { ServerUser } from '@stackframe/stack';
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./elements/data-table-column-header";
import { DataTable } from "./elements/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";


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

function ActionCell(props: {}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Make a copy</DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => <TextCell size={60}>{row.getValue("id")}</TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "profileImageUrl",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Avatar" />,
    cell: ({ row }) => <AvatarCell src={row.getValue("profileImageUrl")} displayName={row.getValue("displayName")} />,
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
    accessorKey: "signedUpAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Signed Up At" />,
    cell: ({ row }) => <DateCell date={row.getValue("signedUpAt")} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell />,
  },
];

export function UserTable(props: { users: ServerUser[] }) {
  return (<DataTable data={props.users} columns={columns}  />);
}