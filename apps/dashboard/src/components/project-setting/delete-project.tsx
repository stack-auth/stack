import React from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";// Make sure this path is correct
import { useDeleteProject } from "@/hooks/use-projects";

type Props = {
  id: string;
  name: string;
  user: number;// Add this prop to handle successful deletion
};

const DeleteProject = ({ id, name, user }: Props) => {
  const { deleteProject, isDeleting, error } = useDeleteProject();

  const handleDelete = async () => {
    await deleteProject(id);
  };

  return (
    <div className="flex justify-end">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete Project</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Project Deletion</DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-col gap-2 mb-5">
                <p>Project Id: <span>{id}</span></p>
                <p>Project Name: <span>{name}</span></p>
                <p>Project Users: <span>{user}</span></p>
                <p className="text-red-500">
                  Warning: Deleting this project will remove all associated data and cannot be undone. Are you sure you want to proceed?
                </p>
                {error && <p className="text-red-500">Error: {error}</p>}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogPrimitive.Close asChild>
              <Button variant="outline">Cancel</Button>
            </DialogPrimitive.Close>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeleteProject;