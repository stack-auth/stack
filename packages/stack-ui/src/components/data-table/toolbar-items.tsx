import { Table } from "@tanstack/react-table";
import { Input } from "../..";

export function SearchToolbarItem<TData>(props: { table: Table<TData>; keyName?: string | null; placeholder: string }) {
  return (
    <Input
      placeholder={props.placeholder}
      value={
        props.keyName ? `${props.table.getColumn(props.keyName)?.getFilterValue() ?? ""}` : (props.table.getState().globalFilter ?? "")
      }
      onChange={(event) =>
        props.keyName
          ? props.table.getColumn(props.keyName)?.setFilterValue(event.target.value)
          : props.table.setGlobalFilter(event.target.value)
      }
      className="h-8 w-[150px] lg:w-[250px]"
    />
  );
}
