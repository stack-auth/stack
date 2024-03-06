'use client';

import NextLink from 'next/link';
import CredentialSignIn from '../elements/CredentialSignIn';
import DividerWithText from '../elements/DividerWithText';
import OAuthGroup from '../elements/OAuthGroup';
import CardFrame from '../elements/CardFrame';
import CardHeader from '../elements/CardHeader';
import { useUser, useStackApp } from '..';
import RedirectMessageCard from '../elements/RedirectMessageCard';

export default function SignIn({ redirectUrl, fullPage=false }: { redirectUrl?: string, fullPage?: boolean }) {
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
      <OAuthGroup type='signin' redirectUrl={redirectUrl} />
      {project.credentialEnabled &&
      <>
        <DividerWithText text={'OR'} />
        <CredentialSignIn redirectUrl={redirectUrl} />
      </>}
    </CardFrame>
  );
}
