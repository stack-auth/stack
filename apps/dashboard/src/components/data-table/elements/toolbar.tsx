"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@stackframe/stack-ui";
import { Table } from "@tanstack/react-table";
import { DataTableViewOptions } from "./view-options";

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
      <div className="flex flex-1 items-center gap-2 flex-wrap">
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
      <DataTableViewOptions table={table} />
    </div>
  );
}
