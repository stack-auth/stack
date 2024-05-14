'use client';

import { Table } from "@tanstack/react-table";
import { Input } from "../ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { priorities, statuses } from "./data/data";

export function toolbarRender<TData>(table: Table<TData>) {
  return (
    <>
      <Input
        placeholder="Filter tasks..."
        value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("title")?.setFilterValue(event.target.value)
        }
        className="h-8 w-[150px] lg:w-[250px]"
      />
      {table.getColumn("status") && (
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title="Status"
          options={statuses}
        />
      )}
      {table.getColumn("priority") && (
        <DataTableFacetedFilter
          column={table.getColumn("priority")}
          title="Priority"
          options={priorities}
        />
      )}
    </>
  );
}