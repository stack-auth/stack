'use client';
import NextLink from 'next/link';
import DividerWithText from '../elements/DividerWithText';
import OAuthGroup from '../elements/OAuthGroup';
import CardFrame from '../elements/CardFrame';
import CredentialSignUp from '../elements/CredentialSignUp';
import CardHeader from '../elements/CardHeader';
import { useUser, useStackApp } from '..';
import RedirectMessageCard from '../elements/RedirectMessageCard';

export default function SignUp({ fullPage=false }: { fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  const project = stackApp.useProject();
  
  if (user) {
    return <RedirectMessageCard type='signedIn' fullPage={fullPage} />;
  }

  return (
    <CardFrame fullPage={fullPage}>
      <CardHeader title="Create a New Account">
        <p>
          {"Already have an account? "}
          <NextLink href={stackApp.urls['signIn']} passHref className="wl_text-blue-500">
            Sign in
          </NextLink>
        </p>
      </CardHeader>
      <OAuthGroup type='signup'/>
      {project.credentialEnabled && <>
        <DividerWithText text={'OR'} />
        <CredentialSignUp/>
      </>}
    </CardFrame>
  );
}
