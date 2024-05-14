import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";

export function SearchToolbarItem<TData>(props: { table: Table<TData>, key: string, placeholder: string }) {
  return (
    <Input
      placeholder={props.placeholder}
      value={(props.table.getColumn(props.key)?.getFilterValue() as string) ?? ""}
      onChange={(event) =>
        props.table.getColumn(props.key)?.setFilterValue(event.target.value)
      }
      className="h-8 w-[150px] lg:w-[250px]"
    />
  );
}