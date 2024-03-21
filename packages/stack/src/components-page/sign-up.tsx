'use client';

import DividerWithText from '../components/divider-with-text';
import OAuthGroup from '../components/oauth-group';
import CardFrame from '../components/card-frame';
import CredentialSignUp from '../components/credential-sign-up';
import CardHeader from '../components/card-header';
import { useUser, useStackApp } from '..';
import RedirectMessageCard from '../components/redirect-message-card';
import { Link, Text } from "../components-core";

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
