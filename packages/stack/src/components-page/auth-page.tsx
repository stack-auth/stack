import { useState } from 'react';
import CredentialSignIn from '../components/credential-sign-in';
import SeparatorWithText from '../components/separator-with-text';
import OAuthGroup from '../components/oauth-group';
import MaybeFullPage from '../components/maybe-full-page';
import { useUser, useStackApp, CredentialSignUp } from '..';
import PredefinedMessageCard from '../components/message-cards/predefined-message-card';
import { Link, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "../components-core";
import MagicLinkSignIn from '../components/magic-link-sign-in';
import { ClientProjectJson } from "@stackframe/stack-shared";

export default function AuthPage({
  fullPage = false,
  type,
  mockProject,
}: {
  fullPage?: boolean,
  type: 'sign-in' | 'sign-up',
  mockProject?: ClientProjectJson,
}) {
  const stackApp = useStackApp();
  const user = useUser();
  const projectFromHook = stackApp.useProject();
  const project = mockProject || projectFromHook;

  const [activeTab, setActiveTab] = useState('magic-link');

  if (user && !mockProject) {
    return <PredefinedMessageCard type='signedIn' fullPage={fullPage} />;
  }

  const enableSeparator = (project.credentialEnabled || project.magicLinkEnabled) && project.oauthProviders.filter(p => p.enabled).length > 0;

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <Text size="xl" as='h2' style={{ fontWeight: 500 }}>
          {type === 'sign-in' ? 'Sign in to your account' : 'Create a new account'}
        </Text>
        {type === 'sign-in' ? (
          <Text>
            {"Don't have an account? "}
            <Link href={stackApp.urls.signUp}>
              Sign up
            </Link>
          </Text>
        ) : (
          <Text>
            {"Already have an account? "}
            <Link href={stackApp.urls.signIn}>
              Sign in
            </Link>
          </Text>
        )}
      </div>
      <OAuthGroup type={type} mockProject={mockProject} />
      {enableSeparator && <SeparatorWithText text={'Or continue with'} />}
      {project.credentialEnabled && project.magicLinkEnabled ? (
        <Tabs defaultValue='magic-link' onValueChange={(value) => setActiveTab(value)}>
          <TabsList>
            <TabsTrigger style={{ backgroundColor: activeTab === 'magic-link' ? 'coral' : '#333333' }} value='magic-link'>Magic Link</TabsTrigger>
            <TabsTrigger style={{ backgroundColor: activeTab === 'password' ? 'coral' : '#333333' }} value='password'>Password</TabsTrigger>
          </TabsList>
          <TabsContent value='magic-link'>
            <MagicLinkSignIn />
          </TabsContent>
          <TabsContent value='password'>
            {type === 'sign-up' ? <CredentialSignUp /> : <CredentialSignIn />}
          </TabsContent>
        </Tabs>
      ) : project.credentialEnabled ? (
        type === 'sign-up' ? <CredentialSignUp /> : <CredentialSignIn />
      ) : project.magicLinkEnabled ? (
        <MagicLinkSignIn />
      ) : null}
    </MaybeFullPage>
  );
}
