'use client';

import { CredentialSignInForm } from '../components/credential-sign-in-form';
import { SeparatorWithText } from '../components/elements/separator-with-text';
import { OAuthButtonGroup } from '../components/oauth-button-group';
import { MaybeFullPage } from '../components/elements/maybe-full-page';
import { useUser, useStackApp } from '..';
import { PredefinedMessageCard } from '../components/message-cards/predefined-message-card';
import { MagicLinkSignInForm } from '../components/magic-link-sign-in-form';
import { CredentialSignUpForm } from '../components/credential-sign-up-form';
import { StyledLink, Tabs, TabsContent, TabsList, TabsTrigger, Typography } from '@stackframe/stack-ui';
import { Project } from '../lib/stack-app';

export function AuthPage({
  fullPage=false,
  type,
  mockProject,
}: {
  fullPage?: boolean,
  type: 'sign-in' | 'sign-up',
  mockProject?: {
    config: {
      credentialEnabled: boolean,
      magicLinkEnabled: boolean,
      oauthProviders: {
        id: string,
      }[],
    },
  },
}) {
  const stackApp = useStackApp();
  const user = useUser();
  const projectFromHook = stackApp.useProject();
  const project = mockProject || projectFromHook;

  if (user && !mockProject) {
    return <PredefinedMessageCard type='signedIn' fullPage={fullPage} />;
  }

  const enableSeparator = (project.config.credentialEnabled || project.config.magicLinkEnabled) && project.config.oauthProviders.length > 0;

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
        <OAuthButtonGroup type={type} mockProject={mockProject} />
        {enableSeparator && <SeparatorWithText text={'Or continue with'} />}
        {project.config.credentialEnabled && project.config.magicLinkEnabled ? (
          <Tabs defaultValue='magic-link'>
            <TabsList className='w-full mb-2'>
              <TabsTrigger value='magic-link' className='flex-1'>Magic Link</TabsTrigger>
              <TabsTrigger value='password' className='flex-1'>Password</TabsTrigger>
            </TabsList>
            <TabsContent value='magic-link'>
              <MagicLinkSignInForm/>
            </TabsContent>
            <TabsContent value='password'>
              {type === 'sign-up' ? <CredentialSignUpForm/> : <CredentialSignInForm/>}
            </TabsContent>
          </Tabs>
        ) : project.config.credentialEnabled ? (
          type === 'sign-up' ? <CredentialSignUpForm/> : <CredentialSignInForm/>
        ) : project.config.magicLinkEnabled ? (
          <MagicLinkSignInForm/>
        ) : null}
      </div>
    </MaybeFullPage>
  );
}
