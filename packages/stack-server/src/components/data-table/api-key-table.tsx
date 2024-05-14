'use client';;
import { useMemo, useState } from "react";
import { ApiKeySet } from '@stackframe/stack';
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./elements/column-header";
import { DataTable } from "./elements/data-table";
import { ActionCell, BadgeCell, DateCell, TextCell } from "./elements/cells";
import { SearchToolbarItem } from "./elements/toolbar-items";
import { ActionDialog } from "../action-dialog";
import { DataTableFacetedFilter } from "./elements/faceted-filter";
import { standardFilterFn } from "./elements/utils";

type ExtendedApiKeySet = ApiKeySet & {
  status: 'valid' | 'expired' | 'revoked',
};

function toolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} keyName="description" placeholder="Filter by description" />
      <DataTableFacetedFilter
        column={table.getColumn("status")}
        title="Status"
        options={['valid', 'expired', 'revoked'].map((provider) => ({
          value: provider,
          label: provider,
        }))}
      />
    </>
  );
}

function RevokeDialog(props: {
  apiKey: ExtendedApiKeySet,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}) {
  return <ActionDialog
    open={props.open}
    onOpenChange={props.onOpenChange}
    title="Revoke API Key"
    danger
    cancelButton
    okButton={{ label: "Revoke Key", onClick: async () => { await props.apiKey.revoke(); } }}
    confirmText="I understand this will unlink all the apps using this API key"
  >
    {`Are you sure you want to revoke client key *****${props.apiKey.publishableClientKey?.lastFour} and server key *****${props.apiKey.secretServerKey?.lastFour}?`}
  </ActionDialog>;
}

function Actions({ row }: { row: Row<ExtendedApiKeySet> }) {
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  return (
    <>
      <RevokeDialog apiKey={row.original} open={isRevokeModalOpen} onOpenChange={setIsRevokeModalOpen} />
      <ActionCell
        invisible={row.original.status !== 'valid'}
        dangerItems={[{
          item: "Revoke",
          onClick: () => setIsRevokeModalOpen(true),
        }]}
      />
    </>
  );
}

const columns: ColumnDef<ExtendedApiKeySet>[] =  [
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => <TextCell size={300}>{row.original.description}</TextCell>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <BadgeCell badges={[row.original.status]} />,
    filterFn: standardFilterFn,
  },
  {
    accessorKey: "clientKey",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client Key" />,
    cell: ({ row }) => <TextCell>*******{row.original.publishableClientKey?.lastFour}</TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "serverKey",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Server Key" />,
    cell: ({ row }) => <TextCell>*******{row.original.secretServerKey?.lastFour}</TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expires At" />,
    cell: ({ row }) => <DateCell date={row.original.expiresAt} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions row={row} />,
  },
];

export function ApiKeyTable(props: { apiKeys: ApiKeySet[] }) {
  const extendedApiKeys = useMemo(() => props.apiKeys.map((apiKey) => ({
    ...apiKey,
    status: ({ 'valid': 'valid', 'manually-revoked': 'revoked', 'expired': 'expired' } as const)[apiKey.whyInvalid() || 'valid'],
  } satisfies ExtendedApiKeySet)), [props.apiKeys]);

  return <DataTable data={extendedApiKeys} columns={columns} toolbarRender={toolbarRender} />;
}