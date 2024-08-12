import { Input } from "../..";
import { Table } from "@tanstack/react-table";

export function SearchToolbarItem<TData>(props: { table: Table<TData>, keyName: string, placeholder: string }) {
  return (
    <Input
      placeholder={props.placeholder}
      value={`${props.table.getColumn(props.keyName)?.getFilterValue() ?? ""}`}
      onChange={(event) => props.table.getColumn(props.keyName)?.setFilterValue(event.target.value)}
      className="h-8 w-[150px] lg:w-[250px]"
    />
  );
}
