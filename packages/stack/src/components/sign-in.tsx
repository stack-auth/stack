'use client';

import NextLink from 'next/link';
import CredentialSignIn from '../elements/credential-sign-in';
import DividerWithText from '../elements/divider-with-text';
import OAuthGroup from '../elements/oauth-group';
import CardFrame from '../elements/card-frame';
import CardHeader from '../elements/card-header';
import { useUser, useStackApp } from '..';
import RedirectMessageCard from '../elements/redirect-message-card';

export default function SignIn({ fullPage=false }: { fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  const project = stackApp.useProject();
  
  if (user) {
    return <RedirectMessageCard type='signedIn' fullPage={fullPage} />;
  }

  return (
    <CardFrame fullPage={fullPage}>
      <CardHeader title="Sign In to Your Account">
        <p>
          {"Don't have an account? "}
          <NextLink href={stackApp.urls['signUp']} passHref className="wl_text-blue-500">
            Sign up
          </NextLink>
        </p>
      </CardHeader>
      <OAuthGroup type='signin'/>
      {project.credentialEnabled &&
      <>
        <DividerWithText text={'OR'} />
        <CredentialSignIn/>
      </>}
    </CardFrame>
  );
}
