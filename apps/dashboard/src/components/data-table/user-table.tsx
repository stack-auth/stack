'use client';
import { useAdminApp } from '@/app/(main)/(protected)/projects/[projectId]/use-admin-app';
import { ServerUser } from '@stackframe/stack';
import { deindent } from '@stackframe/stack-shared/dist/utils/strings';
import { ActionCell, ActionDialog, AvatarCell, BadgeCell, CopyField, DataTableColumnHeader, DataTableManual, DateCell, SearchToolbarItem, SimpleTooltip, TextCell, Typography } from "@stackframe/stack-ui";
import { ColumnDef, ColumnFiltersState, Row, SortingState, Table } from "@tanstack/react-table";
import React, { useEffect, useState } from "react";
import { UserDialog } from '../user-dialog';

export type ExtendedServerUser = ServerUser & {
  authTypes: string[],
  emailVerified: 'verified' | 'unverified',
};

function userToolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <SearchToolbarItem table={table} placeholder="Search table" />
    </>
  );
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

function ImpersonateUserDialog(props: {
  user: ServerUser,
  impersonateSnippet: string | null,
  onClose: () => void,
}) {
  return <ActionDialog
    open={props.impersonateSnippet !== null}
    onOpenChange={(open) => !open && props.onClose()}
    title="Impersonate User"
    okButton
  >
    <Typography>
      Open your website and paste the following code into the browser console:
    </Typography>
    <CopyField
      monospace
      height={60}
      value={props.impersonateSnippet ?? ""}
    />
  </ActionDialog>;
}

function UserActions({ row }: { row: Row<ExtendedServerUser> }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [impersonateSnippet, setImpersonateSnippet] = useState<string | null>(null);
  const app = useAdminApp();

  return (
    <>
      <UserDialog user={row.original} type="edit" open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
      <DeleteUserDialog user={row.original} open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} />
      <ImpersonateUserDialog user={row.original} impersonateSnippet={impersonateSnippet} onClose={() => setImpersonateSnippet(null)} />
      <ActionCell
        items={[
          {
            item: "Impersonate",
            onClick: async () => {
              const expiresInMillis = 1000 * 60 * 60 * 2;
              const expiresAtDate = new Date(Date.now() + expiresInMillis);
              const session = await row.original.createSession({ expiresInMillis });
              const tokens = await session.getTokens();
              setImpersonateSnippet(deindent`
                document.cookie = 'stack-refresh-${app.projectId}=${tokens.refreshToken}; expires=${expiresAtDate.toUTCString()}; path=/'; 
                window.location.reload();
              `);
            }
          },
          '-',
          {
            item: "Edit",
            onClick: () => setIsEditModalOpen(true),
          },
          ...row.original.isMultiFactorRequired ? [{
            item: "Remove 2FA",
            onClick: async () => {
              await row.original.update({ totpMultiFactorSecret: null });
            },
          }] : [],
          {
            item: "Delete",
            onClick: () => setIsDeleteModalOpen(true),
            danger: true,
          },
        ]}
      />
    </>
  );
}

export const getCommonUserColumns = <T extends ExtendedServerUser>() => [
  {
    accessorKey: "profileImageUrl",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Avatar" />,
    cell: ({ row }) => <AvatarCell src={row.original.profileImageUrl || undefined} />,
    enableSorting: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="ID" />,
    cell: ({ row }) => <TextCell size={60}>{row.original.id}</TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "displayName",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Display Name" />,
    cell: ({ row }) =>  <TextCell size={120}><span className={row.original.displayName === null ? 'text-slate-400' : ''}>{row.original.displayName ?? '–'}</span></TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "primaryEmail",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Primary Email" />,
    cell: ({ row }) => <TextCell
      size={180}
      icon={row.original.emailVerified === "unverified" && <SimpleTooltip tooltip='Email not verified' type='warning'/>}>
      {row.original.primaryEmail}
    </TextCell>,
    enableSorting: false,
  },
  {
    accessorKey: "lastActiveAt",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Last Active" />,
    cell: ({ row }) => <DateCell date={row.original.lastActiveAt} />,
    enableSorting: false,
  },
  {
    accessorKey: "emailVerified",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Email Verified" />,
    cell: ({ row }) => <TextCell>{row.original.emailVerified === 'verified' ? '✓' : '✗'}</TextCell>,
    enableSorting: false,
  },
] satisfies ColumnDef<T>[];

const columns: ColumnDef<ExtendedServerUser>[] =  [
  ...getCommonUserColumns<ExtendedServerUser>(),
  {
    accessorKey: "authTypes",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Auth Method" />,
    cell: ({ row }) => <BadgeCell badges={row.original.authTypes} />,
    enableSorting: false,
  },
  {
    accessorKey: "signedUpAt",
    header: ({ column }) => <DataTableColumnHeader column={column} columnTitle="Signed Up At" />,
    cell: ({ row }) => <DateCell date={row.original.signedUpAt} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions row={row} />,
  },
];

export function extendUsers(users: ServerUser[]): ExtendedServerUser[] {
  return users.map((user) => ({
    ...user,
    authTypes: [
      ...user.otpAuthEnabled ? ["otp"] : [],
      ...user.hasPassword ? ["password"] : [],
      ...user.oauthProviders.map(p => p.id),
    ],
    emailVerified: user.primaryEmailVerified ? "verified" : "unverified",
  } satisfies ExtendedServerUser)).sort((a, b) => a.signedUpAt > b.signedUpAt ? -1 : 1);
}

export function UserTable() {
  const stackAdminApp = useAdminApp();
  const [users, setUsers] = useState<ExtendedServerUser[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{id: 'signedUpAt', desc: true}]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [cursors, setCursors] = useState<Record<number, string>>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<any>();
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let filters: any = {};

    const orderMap = {
      signedUpAt: "signedUpAt",
    } as const;
    if (sorting.length > 0 && sorting[0].id in orderMap) {
      filters.orderBy = orderMap[sorting[0].id as keyof typeof orderMap];
      filters.desc = sorting[0].desc;
    }

    stackAdminApp.listUsers({
      cursor: cursors[pagination.pageIndex],
      limit: pagination.pageSize,
      query: globalFilter,
      ...filters,
    }).then((users) => {
      setUsers(extendUsers(users));
      setCursors(c => users.nextCursor ? { ...c, [pagination.pageIndex + 1]: users.nextCursor } : c);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination, stackAdminApp, sorting, columnFilters, refreshCounter]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(pagination => ({ ...pagination, pageIndex: 0 }));
    setCursors({});
  }, [columnFilters, sorting, pagination.pageSize]);

  // Refresh the users when the global filter changes. Delay to prevent unnecessary re-renders.
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshCounter(x => x + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [globalFilter]);

  return <DataTableManual
    columns={columns}
    data={users}
    toolbarRender={userToolbarRender}
    sorting={sorting}
    setSorting={setSorting}
    pagination={pagination}
    setPagination={setPagination}
    columnFilters={columnFilters}
    setColumnFilters={setColumnFilters}
    defaultVisibility={{ emailVerified: false }}
    rowCount={pagination.pageSize * Object.keys(cursors).length + (cursors[pagination.pageIndex + 1] ? 1 : 0)}
    globalFilter={globalFilter}
    setGlobalFilter={setGlobalFilter}
  />;
}
