import { Metadata } from "next";
import { z } from "zod";
import { columns } from "@/components/data-table/columns";
import { DataTable } from "@/components/data-table/data-table";
import { taskSchema } from "@/components/data-table/data/schema";
import data from "@/components/data-table/data/tasks.json";
import { toolbarRender } from "@/components/data-table/toolbar";


export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
};

// Simulate a database read for tasks.
async function getTasks() {
  return z.array(taskSchema).parse(data);
}

export default async function TaskPage() {
  const tasks = await getTasks();

  return (
    <>
      <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
        <DataTable data={tasks} columns={columns} toolbarRender={toolbarRender} />
      </div>
    </>
  );
}
