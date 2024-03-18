'use client';

import CredentialSignIn from '../elements/credential-sign-in';
import DividerWithText from '../elements/divider-with-text';
import OAuthGroup from '../elements/oauth-group';
import CardFrame from '../elements/card-frame';
import CardHeader from '../elements/card-header';
import { useUser, useStackApp } from '..';
import RedirectMessageCard from '../elements/redirect-message-card';
import { Link, Text } from '@stackframe/stack-ui';

export default function SignIn({ fullPage=false }: { fullPage?: boolean }) {
  const stackApp = useStackApp();
  const user = useUser();
  const project = stackApp.useProject();
  
  if (user) {
    return <RedirectMessageCard type='signedIn' fullPage={fullPage} />;
  }

  const enableDivider = project.credentialEnabled && project.oauthProviders.filter(p => p.enabled).length > 0;

  return (
    <CardFrame fullPage={fullPage}>
      <CardHeader title="Sign In to Your Account">
        <Text>
          {"Don't have an account? "}
          <Link href={stackApp.urls['signUp']}>
            Sign up
          </Link>
        </Text>
      </CardHeader>
      <OAuthGroup type='signin'/>
      {enableDivider && <DividerWithText text={'OR'} />}
      {project.credentialEnabled && <CredentialSignIn/>}
    </CardFrame>
  );
}
