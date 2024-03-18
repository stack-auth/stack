'use client';
import NextLink from 'next/link';
import DividerWithText from '../elements/divider-with-text';
import OAuthGroup from '../elements/oauth-group';
import CardFrame from '../elements/card-frame';
import CredentialSignUp from '../elements/credential-sign-up';
import CardHeader from '../elements/card-header';
import { useUser, useStackApp } from '..';
import RedirectMessageCard from '../elements/redirect-message-card';
import { Link, Text } from '@stackframe/stack-ui';

export default function SignUp({ fullPage=false }: { fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  const project = stackApp.useProject();
  
  if (user) {
    return <RedirectMessageCard type='signedIn' fullPage={fullPage} />;
  }

  const enableDivider = project.credentialEnabled && project.oauthProviders.filter(p => p.enabled).length > 0;

  return (
    <CardFrame fullPage={fullPage}>
      <CardHeader title="Create a New Account">
        <Text>
          {"Already have an account? "}
          <Link href={stackApp.urls['signIn']}>
            Sign in
          </Link>
        </Text>
      </CardHeader>
      <OAuthGroup type='signup'/>
      {enableDivider && <DividerWithText text={'OR'} />}
      {project.credentialEnabled && <CredentialSignUp/>}
    </CardFrame>
  );
}
