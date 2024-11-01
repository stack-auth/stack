"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stackframe/stack-ui";
import {
  ColumnDef,
  ColumnFiltersState,
  GlobalFiltering,
  OnChangeFn,
  PaginationState,
  SortingState,
  Table as TableType,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { DataTablePagination } from "./pagination";
import { DataTableToolbar } from "./toolbar";

export function TableView<TData, TValue>(props: {
  table: TableType<TData>,
  columns: ColumnDef<TData, TValue>[],
  toolbarRender?: (table: TableType<TData>) => React.ReactNode,
}) {
  return (
    <div className="space-y-4">
      <DataTableToolbar table={props.table} toolbarRender={props.toolbarRender} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {props.table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {props.table.getRowModel().rows.length ? (
              props.table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={props.columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={props.table} />
    </div>
  );
}

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[],
  data: TData[],
  toolbarRender?: (table: TableType<TData>) => React.ReactNode,
  defaultVisibility?: VisibilityState,
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbarRender,
  defaultVisibility,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = React.useState<any>();

  return <DataTableManual
    columns={columns}
    data={data}
    toolbarRender={toolbarRender}
    defaultVisibility={defaultVisibility}
    sorting={sorting}
    setSorting={setSorting}
    columnFilters={columnFilters}
    setColumnFilters={setColumnFilters}
    manualPagination={false}
    manualFiltering={false}
    pagination={pagination}
    setPagination={setPagination}
    globalFilter={globalFilter}
    setGlobalFilter={setGlobalFilter}
  />;
}

type DataTableServerProps<TData, TValue> = DataTableProps<TData, TValue> & {
  sorting?: SortingState,
  setSorting?: OnChangeFn<SortingState>,
  pagination?: PaginationState,
  setPagination?: OnChangeFn<PaginationState>,
  rowCount?: number,
  columnFilters?: ColumnFiltersState,
  setColumnFilters?: OnChangeFn<ColumnFiltersState>,
  manualPagination?: boolean,
  manualFiltering?: boolean,
  globalFilter?: any,
  setGlobalFilter?: OnChangeFn<any>,
}

export function DataTableManual<TData, TValue>({
  columns,
  data,
  toolbarRender,
  defaultVisibility,
  sorting,
  setSorting,
  pagination,
  setPagination,
  rowCount,
  columnFilters,
  setColumnFilters,
  globalFilter,
  setGlobalFilter,
  manualPagination = true,
  manualFiltering = true,
}: DataTableServerProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultVisibility || {});

  const table: TableType<TData> = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter: globalFilter,
    },
    enableRowSelection: true,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getColumnCanGlobalFilter: (c) => c.columnDef.enableGlobalFilter ?? GlobalFiltering.getDefaultOptions!(table).getColumnCanGlobalFilter!(c),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    autoResetAll: false,
    manualPagination,
    manualFiltering,
    rowCount,
  });

  return <TableView table={table} columns={columns} toolbarRender={toolbarRender} />;
}
