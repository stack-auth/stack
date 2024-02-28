import Link from 'next/link';
import { stackServerApp } from 'src/stack';


export default async function Page() {
  const user = await stackServerApp.getUser();

  const authButtons = (
    <div className='flex gap-5'>
      <Link href={stackServerApp.urls.signIn}>
        <button  className='btn btn-primary'>
          Sign In
        </button>
      </Link>
      <Link href="/handler/signup">
        <button  className='btn btn-primary'>
          Sign Up
        </button>
      </Link>
    </div>
  );
  
  return (
    <div className='flex flex-col items-center justify-center h-screen w-full gap-10'>
      {user ? (
        <div className='flex flex-col gap-5 justify-center items-center'>
          <p className='text-lg'>Logged in as: <span className='font-bold'>{user.primaryEmail}</span></p>
          <Link href={stackServerApp.urls.signOut} className='text-blue-500'>
            Sign Out
          </Link>
        </div>
      ) : authButtons}
    </div>
  );
}
