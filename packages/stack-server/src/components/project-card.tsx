'use client';;
import { CardDescription, CardFooter, CardHeader, CardTitle, ClickableCard } from './ui/card';
import { Project } from '@stackframe/stack';
import { useFromNow } from '@/hooks/use-from-now';
import { useRouter } from 'next/navigation';
import Typography from './ui/typography';

export function ProjectCard({ project }: { project: Project }) {
  const createdAt = useFromNow(project.createdAt);
  const router = useRouter();

  return (
    <ClickableCard className='flex flex-col' onClick={() => router.push(`/projects/${project.id}`)}>
      <CardHeader>
        <CardTitle>{project.displayName}</CardTitle>
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