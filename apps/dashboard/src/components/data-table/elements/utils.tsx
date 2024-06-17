export function standardFilterFn (row: any, id: string, value: any) {
  return value.includes(row.getValue(id));
}