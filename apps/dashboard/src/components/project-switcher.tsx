"use client";
import { useRouter } from "@/components/router";
import { useUser } from "@stackframe/stack";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@stackframe/stack-ui";
import { PlusIcon } from "lucide-react";
import { useMemo } from "react";

export function ProjectAvatar(props: { displayName: string }) {
  return (
    <div className="w-7 h-7 rounded-sm bg-zinc-200 dark:bg-zinc-700 mr-1 flex items-center justify-center">
      <p>
        {props.displayName.slice(0,1).toUpperCase()}
      </p>
    </div>
  );
}

export function ProjectSwitcher(props: { currentProjectId: string }) {
  const router = useRouter();
  const user = useUser({ or: 'redirect', projectIdMustMatch: "internal" });
  const rawProjects = user.useOwnedProjects();
  const { currentProject, projects } = useMemo(() => {
    const currentProject = rawProjects.find((project) => project.id === props.currentProjectId);
    const projects = rawProjects.sort((a, b) => b.id === props.currentProjectId ? 1 : -1);
    return { currentProject, projects };
  }, [props.currentProjectId, rawProjects]);

  return (
    <Select defaultValue={props.currentProjectId} onValueChange={(value) => { router.push(`/projects/${value}`); }}>
      <SelectTrigger
        className="h-10 flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0"
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          <ProjectAvatar displayName={currentProject?.displayName || ""} />
          <span className="w-32 sm:w-44 truncate">
            { currentProject?.displayName }
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <div className="flex items-center gap-2 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              <ProjectAvatar displayName={p.displayName} />
              <span className="w-32 sm:w-44 truncate">
                { p.displayName }
              </span>
            </div>
          </SelectItem>
        ))}
        <Button onClick={() => router.push("/new-project")} variant="outline" className="w-full mt-2 gap-1">
          <PlusIcon className="h-4 w-4" />
          Create new project
        </Button>
      </SelectContent>
    </Select>
  );
}
