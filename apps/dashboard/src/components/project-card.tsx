'use client';
import { CardDescription, CardFooter, CardHeader, CardTitle, ClickableCard } from './ui/card';
import { useFromNow } from '@/hooks/use-from-now';
import { useRouter } from "@/components/router";
import Typography from './ui/typography';
import { AdminProject } from '@stackframe/stack';

export function ProjectCard({ project }: { project: AdminProject }) {
  const createdAt = useFromNow(project.createdAt);
  const router = useRouter();

  return (
    <ClickableCard className='flex flex-col' onClick={() => router.push(`/projects/${project.id}`)}>
      <CardHeader>
        <CardTitle className="normal-case">{project.displayName}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Typography type='label' variant='secondary'>
          {project.userCount} users
        </Typography>
        <Typography type='label' variant='secondary'>
          {createdAt}
        </Typography>
      </CardFooter>
    </ClickableCard>
  );
}
