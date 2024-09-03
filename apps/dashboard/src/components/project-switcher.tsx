"use client";

import { PlusIcon } from "lucide-react";
import { useMemo } from "react";
import { useUser } from "@stackframe/stack";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@stackframe/stack-ui";
import { useRouter } from "@/components/router";

export function ProjectAvatar(props: { displayName: string }) {
  return (
    <div className="mr-1 flex h-7 w-7 items-center justify-center rounded-sm bg-zinc-200 dark:bg-zinc-700">
      <p>{props.displayName.slice(0, 1).toUpperCase()}</p>
    </div>
  );
}

export function ProjectSwitcher(props: { currentProjectId: string }) {
  const router = useRouter();
  const user = useUser({ or: "redirect", projectIdMustMatch: "internal" });
  const rawProjects = user.useOwnedProjects();
  const { currentProject, projects } = useMemo(() => {
    const currentProject = rawProjects.find((project) => project.id === props.currentProjectId);
    const projects = rawProjects.sort((a, b) => (b.id === props.currentProjectId ? 1 : -1));
    return { currentProject, projects };
  }, [props.currentProjectId, rawProjects]);

  return (
    <Select
      defaultValue={props.currentProjectId}
      onValueChange={(value) => {
        router.push(`/projects/${value}`);
      }}
    >
      <SelectTrigger
        className="flex h-10 items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1
          [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0"
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          <ProjectAvatar displayName={currentProject?.displayName || ""} />
          <span>{currentProject?.displayName}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <div className="flex items-center gap-2 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              <ProjectAvatar displayName={p.displayName} />
              {p.displayName}
            </div>
          </SelectItem>
        ))}
        <Button onClick={() => router.push("/new-project")} variant="outline" className="mt-2 w-full gap-1">
          <PlusIcon className="h-4 w-4" />
          Create new project
        </Button>
      </SelectContent>
    </Select>
  );
}
