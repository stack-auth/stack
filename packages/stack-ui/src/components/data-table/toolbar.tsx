"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@stackframe/stack-ui";
import { Cell, Table } from "@tanstack/react-table";
import { DataTableViewOptions } from "./view-options";
import { DownloadIcon } from "lucide-react";
import { mkConfig, generateCsv, download } from 'export-to-csv';

interface DataTableToolbarProps<TData> {
  table: Table<TData>,
  toolbarRender?: (table: Table<TData>) => React.ReactNode,
}

export function DataTableToolbar<TData>({
  table,
  toolbarRender
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const isSorted = table.getState().sorting.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 flex-wrap">
        {toolbarRender?.(table)}
        {(isFiltered || isSorted) && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              table.resetSorting();
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 flex-wrap">
        <DataTableViewOptions table={table} />
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
          onClick={() => {
            const csvConfig = mkConfig({
              fieldSeparator: ',',
              filename: 'data',
              decimalSeparator: '.',
              useKeysAsHeaders: true,
            });

            const renderCellValue = (cell: Cell<TData, unknown>) => {
              const rendered = cell.renderValue();
              if (rendered === null) {
                return undefined;
              }
              if (['string', 'number', 'boolean', 'undefined'].includes(typeof rendered)) {
                return rendered;
              }
              if (rendered instanceof Date) {
                return rendered.toISOString();
              }
              if (typeof rendered === 'object') {
                return JSON.stringify(rendered);
              }
            };


            const rowModel = table.getCoreRowModel();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const rows = rowModel.rows.map(row => Object.fromEntries(row.getAllCells().map(c => [c.column.id, renderCellValue(c)]).filter(([_, v]) => v !== undefined)));
            if (rows.length === 0) {
              alert("No data to export");
              return;
            }
            const csv = generateCsv(csvConfig)(rows as any);
            download(csvConfig)(csv);
          }}
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
