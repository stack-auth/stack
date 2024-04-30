'use client';

import { useRouter } from 'next/navigation';
import { useStackApp, useUser, Button, Link, Text } from '@stackframe/stack';

export default function PageClient() {
  const user = useUser();
  const router = useRouter();
  const app = useStackApp();

  const authButtons = (
    <div className='flex flex-col gap-5 justify-center items-center'>
      <Text size='lg'>Welcome to the Stack demo app!</Text>
      <Text size='md'>You can click on the buttons below to see the sign-in/sign-up pages you get out of the box.</Text>
      <Text size='md'>Also feel free to check out the things on the top right corner.</Text>
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
          <Text size='lg'>Logged in as: <span className='font-bold'>{user.primaryEmail}</span></Text>
          <Text size='md'>Click on your user&apos;s image at the top right to see your account settings.</Text>
          <Text size='md'>Like what you see? <Link href="https://app.stackframe.co">Create your own project</Link> on our dashboard.</Text>
          {user.primaryEmail === "ycdemo@stack-auth.com" && (
            <Text size='md' style={{ backgroundColor: "orange" }}>(It seems you&apos;re on the YC demo account. You can use the same credentials on the dashboard again.)</Text>
          )}
          <Link href={app.urls.signOut}>
            Sign Out
          </Link>
        </div>
      ) : authButtons}
    </div>
  );
}
