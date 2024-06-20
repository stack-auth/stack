'use client';

import CredentialSignIn from '../components/credential-sign-in';
import SeparatorWithText from '../components/separator-with-text';
import OAuthGroup from '../components/oauth-group';
import MaybeFullPage from '../components/maybe-full-page';
import { useUser, useStackApp, CredentialSignUp } from '..';
import PredefinedMessageCard from '../components/message-cards/predefined-message-card';
import MagicLinkSignIn from '../components/magic-link-sign-in';
import { ClientProjectJson } from "@stackframe/stack-shared";
import { StyledLink } from '../components/ui/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Typography from '../components/ui/typography';

export default function AuthPage({ 
  fullPage=false,
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

  if (user && !mockProject) {
    return <PredefinedMessageCard type='signedIn' fullPage={fullPage} />;
  }

  const enableSeparator = (project.credentialEnabled || project.magicLinkEnabled) && project.oauthProviders.filter(p => p.enabled).length > 0;

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div className='stack-scope flex flex-col items-stretch'>
        <div className="text-center mb-6">
          <Typography type='h2'>
            {type === 'sign-in' ? 'Sign in to your account' : 'Create a new account'}
          </Typography>
          {type === 'sign-in' ? (
            <Typography>
              {"Don't have an account? "}
              <StyledLink href={stackApp.urls.signUp}>
                Sign up
              </StyledLink>
            </Typography>
          ) : (
            <Typography>
              {"Already have an account? "}
              <StyledLink href={stackApp.urls.signIn}>
                Sign in
              </StyledLink>
            </Typography>
          )}
        </div>
        <OAuthGroup type={type} mockProject={mockProject} />
        {enableSeparator && <SeparatorWithText text={'Or continue with'} />}
        {project.credentialEnabled && project.magicLinkEnabled ? (
          <Tabs defaultValue='magic-link'>
            <TabsList className='w-full mb-2'>
              <TabsTrigger value='magic-link' className='flex-1'>Magic Link</TabsTrigger>
              <TabsTrigger value='password' className='flex-1'>Password</TabsTrigger>
            </TabsList>
            <TabsContent value='magic-link'>
              <MagicLinkSignIn/>
            </TabsContent>
            <TabsContent value='password'>
              {type === 'sign-up' ? <CredentialSignUp/> : <CredentialSignIn/>}
            </TabsContent>
          </Tabs>
        ) : project.credentialEnabled ? (
          type === 'sign-up' ? <CredentialSignUp/> : <CredentialSignIn/>
        ) : project.magicLinkEnabled ? (
          <MagicLinkSignIn/>
        ) : null}
      </div>
    </MaybeFullPage>
  );
}
