'use client';

import { useRouter } from 'next/navigation';
import { useStackApp, useUser } from '@stackframe/stack';
import { Button, Link, Typography } from '@stackframe/stack-ui';

export default function PageClient() {
  const user = useUser();
  const router = useRouter();
  const app = useStackApp();

  const authButtons = (
    <div className='flex flex-col gap-5 justify-center items-center'>
      <Typography type='h3'>Welcome to the Stack demo app!</Typography>
      <Typography>You can click on the buttons below to see the sign-in/sign-up pages you get out of the box.</Typography>
      <Typography>Also feel free to check out the things on the top right corner.</Typography>
      <div className='flex gap-5'>
        <Button onClick={() => router.push(app.urls.signIn)}>Sign In</Button>
        <Button onClick={() => router.push('/handler/signup')}>Sign Up</Button>
      </div>
    </div>
  );
  
  return (
    <div className='flex flex-col items-center justify-center h-full w-full gap-10'>
      {user ? (
        <div className='flex flex-col gap-5 justify-center items-center'>
          <Typography type='h3'>Logged in as: <span className='font-bold'>{user.primaryEmail}</span></Typography>
          <Typography>Click on your user&apos;s image at the top right to see your account settings.</Typography>
          <Typography>Like what you see? <Link href="https://app.stackframe.co">Create your own project</Link> on our dashboard.</Typography>
          <Link href={app.urls.signOut}>
            Sign Out
          </Link>
        </div>
      ) : authButtons}
    </div>
  );
}
