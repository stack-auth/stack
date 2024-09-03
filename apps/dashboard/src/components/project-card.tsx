"use client";

import { AdminProject } from "@stackframe/stack";
import { CardDescription, CardFooter, CardHeader, CardTitle, ClickableCard, Typography } from "@stackframe/stack-ui";
import { useRouter } from "@/components/router";
import { useFromNow } from "@/hooks/use-from-now";

export function ProjectCard({ project }: { project: AdminProject }) {
  const createdAt = useFromNow(project.createdAt);
  const router = useRouter();

  return (
    <ClickableCard className="flex flex-col" onClick={() => router.push(`/projects/${project.id}`)}>
      <CardHeader>
        <CardTitle className="normal-case">{project.displayName}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-2 flex justify-between">
        <Typography type="label" variant="secondary">
          {project.userCount} users
        </Typography>
        <Typography type="label" variant="secondary">
          {createdAt}
        </Typography>
      </CardFooter>
    </ClickableCard>
  );
}
