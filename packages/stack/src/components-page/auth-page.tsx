'use client';

import { CredentialSignIn } from '../components/credential-sign-in';
import { SeparatorWithText } from '../components/elements/separator-with-text';
import { OAuthButtonGroup } from '../components/oauth-button-group';
import { MaybeFullPage } from '../components/elements/maybe-full-page';
import { useUser, useStackApp } from '..';
import { PredefinedMessageCard } from '../components/message-cards/predefined-message-card';
import { MagicLinkSignIn } from '../components/magic-link-sign-in';
import { CredentialSignUp } from '../components/credential-sign-up';
import { StyledLink, Tabs, TabsContent, TabsList, TabsTrigger, Typography } from '@stackframe/stack-ui';
import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';
import { useEffect } from 'react';

export function AuthPage({
  fullPage=false,
  type,
  automaticRedirect,
  mockProject,
}: {
  fullPage?: boolean,
  type: 'sign-in' | 'sign-up',
  automaticRedirect?: boolean,
  mockProject?: {
    config: {
      signUpEnabled: boolean,
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

  useEffect(() => {
    if (automaticRedirect) {
      if (user && !mockProject) {
        runAsynchronously(type === 'sign-in' ? stackApp.redirectToAfterSignIn() : stackApp.redirectToAfterSignUp());
      }
    }
  }, [user, mockProject, stackApp, automaticRedirect]);

  if (user && !mockProject) {
    return <PredefinedMessageCard type='signedIn' fullPage={fullPage} />;
  }

  if (type === 'sign-up' && !project.config.signUpEnabled) {
    return <PredefinedMessageCard type='signUpDisabled' fullPage={fullPage} />;
  }

  const enableSeparator = (project.config.credentialEnabled || project.config.magicLinkEnabled) && project.config.oauthProviders.length > 0;

  return (
    <MaybeFullPage fullPage={fullPage}>
      <div className='stack-scope flex flex-col items-stretch' style={{ width: '380px', padding: fullPage ? '1rem' : 0 }}>
        <div className="text-center mb-6">
          <Typography type='h2'>
            {type === 'sign-in' ? 'Sign in to your account' : 'Create a new account'}
          </Typography>
          {type === 'sign-in' ? (
            project.config.signUpEnabled && (
              <Typography>
                {"Don't have an account? "}
                <StyledLink href={stackApp.urls.signUp} onClick={(e) => {
                  runAsynchronously(stackApp.redirectToSignUp());
                  e.preventDefault();
                }}>
                  Sign up
                </StyledLink>
              </Typography>
            )
          ) : (
            <Typography>
              {"Already have an account? "}
              <StyledLink href={stackApp.urls.signIn} onClick={(e) => {
                runAsynchronously(stackApp.redirectToSignIn());
                e.preventDefault();
              }}>
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
              <MagicLinkSignIn/>
            </TabsContent>
            <TabsContent value='password'>
              {type === 'sign-up' ? <CredentialSignUp/> : <CredentialSignIn/>}
            </TabsContent>
          </Tabs>
        ) : project.config.credentialEnabled ? (
          type === 'sign-up' ? <CredentialSignUp/> : <CredentialSignIn/>
        ) : project.config.magicLinkEnabled ? (
          <MagicLinkSignIn/>
        ) : null}
      </div>
    </MaybeFullPage>
  );
}
