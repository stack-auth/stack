"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@stackframe/stack";
import { wait } from "@stackframe/stack-shared/dist/utils/promises";
import { Button, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@stackframe/stack-ui";
import { ProjectCard } from "@/components/project-card";
import { useRouter } from "@/components/router";
import { SearchBar } from "@/components/search-bar";

export default function PageClient() {
  const user = useUser({ or: "redirect", projectIdMustMatch: "internal" });
  const rawProjects = user.useOwnedProjects();
  const [sort, setSort] = useState<"recency" | "name">("recency");
  const [search, setSearch] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (rawProjects.length === 0) {
      router.push("/new-project");
    }
  }, [router, rawProjects]);

  const projects = useMemo(() => {
    let newProjects = [...rawProjects];

    if (search) {
      newProjects = newProjects.filter((project) => project.displayName.toLowerCase().includes(search.toLowerCase()));
    }

    return newProjects.sort((a, b) => {
      if (sort === "recency") {
        return a.createdAt > b.createdAt ? -1 : 1;
      } else {
        return a.displayName.localeCompare(b.displayName);
      }
    });
  }, [rawProjects, sort, search]);

  return (
    <div className="flex-grow p-4">
      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row">
        <SearchBar placeholder="Search project name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-4">
          <Select value={sort} onValueChange={(n) => setSort(n === "recency" ? "recency" : "name")}>
            <SelectTrigger>
              <SelectValue>Sort by {sort === "recency" ? "recency" : "name"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="recency">Recency</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            onClick={async () => {
              router.push("/new-project");
              return await wait(2000);
            }}
          >
            Create Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
