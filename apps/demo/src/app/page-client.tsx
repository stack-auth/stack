'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStackApp, useUser } from '@stackframe/stack';
import { Button } from '@stackframe/stack-ui';

export default function PageClient() {
  const user = useUser();
  const router = useRouter();
  const app = useStackApp();

  const authButtons = (
    <div className='flex gap-5'>
      <Button onClick={() => router.push(app.urls.signIn)}>Sign In</Button>
      <Button onClick={() => router.push('/handler/signup')}>Sign Up</Button>
    </div>
  );
  
  return (
    <div className='flex flex-col items-center justify-center h-screen w-full gap-10'>
      {user ? (
        <div className='flex flex-col gap-5 justify-center items-center'>
          <p className='text-lg'>Logged in as: <span className='font-bold'>{user.primaryEmail}</span></p>
          <Link href={app.urls.signOut} className='text-blue-500'>
            Sign Out
          </Link>
        </div>
      ) : authButtons}
    </div>
  );
}
