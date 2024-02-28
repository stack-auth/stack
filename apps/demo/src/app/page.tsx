import Link from 'next/link';
import CardFrame from 'stack/src/elements/CardFrame';
import { stackServerApp } from 'src/stack';
import ColorModeButton from 'src/components/ColorThemeButton';
import SignOutButton from 'src/components/SignOutButton';
import UserInfo from 'src/components/UserInfo';
import UserInfoClient from 'src/components/UserInfoClient';

export default async function Page() {
  return (
  // <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
  //   <div>
  //     <div>Server:</div>
  //     <UserInfo />
  //     <div style={{ marginBottom: '1rem' }}/>
  //     <div>Client:</div>
  //     <UserInfoClient />
  //   </div>
      
  //   <div style={{ marginBottom: '1rem' }}/>
  //   <Link href="/handler/signin">
  //     Sign in
  //   </Link>
  //   <Link href="/handler/signup">
  //     Sign up
  //   </Link>
  //   <div style={{ marginBottom: '1rem' }}/>
  //   <SignOutButton />
  //   <Link href={stackServerApp.urls['signOut']}>
  //     Sign out (server)
  //   </Link>
  //   <div style={{ marginBottom: '1rem' }}/>
  //   <ColorModeButton />

    //   <div style={{ marginBottom: '1rem' }}/>
    //   <Link href="/protected-client">
    //     Protected client
    //   </Link>
    //   <Link href="/protected-server">
    //     Protected server
    //   </Link>
    // </div>
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h1>Stack Demo</h1>
    </div>
  );
}
