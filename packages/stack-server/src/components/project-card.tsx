'use client';;
import { CardDescription, CardFooter, CardHeader, CardTitle, ClickableCard } from './ui/card';
import { CardContent } from '@mui/joy';
import { Project } from '@stackframe/stack';
import { useFromNow } from '@/hooks/use-from-now';
import { useRouter } from 'next/navigation';

export function ProjectCard({ project }: { project: Project }) {
  const createdAt = useFromNow(project.createdAt);
  const router = useRouter();

  return (
    <ClickableCard className='flex flex-col' onClick={() => router.push(`/projects/${project.id}`)}>
      <CardHeader>
        <CardTitle>{project.displayName}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className='text-sm text-gray-500'>
          {project.userCount} users
        </p>
        <p className='text-sm text-gray-500'>
          {createdAt}
        </p>
      </CardFooter>
    </ClickableCard>
  );
}