'use client';

import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';
import { Button, InputOTP, InputOTPGroup, InputOTPSlot, StyledLink, Tabs, TabsContent, TabsList, TabsTrigger, Typography } from '@stackframe/stack-ui';
import { useEffect, useState } from 'react';
import { useStackApp, useUser } from '..';
import { CredentialSignIn } from '../components/credential-sign-in';
import { CredentialSignUp } from '../components/credential-sign-up';
import { MaybeFullPage } from '../components/elements/maybe-full-page';
import { SeparatorWithText } from '../components/elements/separator-with-text';
import { MagicLinkSignIn } from '../components/magic-link-sign-in';
import { PredefinedMessageCard } from '../components/message-cards/predefined-message-card';
import { OAuthButtonGroup } from '../components/oauth-button-group';
import { useTranslation } from '../lib/translations';

function OTPPage(props: {
  onBack?: () => void,
  onSubmit: (otp: string) => void,
}) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState<string>('');

  return (
    <PageFrame
      title={t("Enter OTP code")}
      subtitle={<Typography>{t("You will receive an email with the code")}</Typography>}
      fullPage={true}
    >
      <form className='w-full flex flex-col items-center mb-4'>
        <InputOTP
          maxLength={6}
          pattern={"^[a-zA-Z0-9]+$"}
          value={otp}
          onChange={value => setOtp(value.toUpperCase())}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </form>
      <Button variant='link' onClick={props.onBack} className='underline'>Go back</Button>
    </PageFrame>
  );
}

function PageFrame(props: {
  subtitle?: React.ReactNode,
  title: string,
  fullPage: boolean,
  children: React.ReactNode,
}) {
  return (
    <MaybeFullPage fullPage={props.fullPage}>
      <div className='stack-scope flex flex-col items-stretch' style={{ width: '380px', padding: props.fullPage ? '1rem' : 0 }}>
        <div className="text-center mb-6">
          <Typography type='h2'>
            {props.title}
          </Typography>
          {props.subtitle}
        </div>
        {props.children}
      </div>
    </MaybeFullPage>
  );
}

export function AuthPage(props: {
  fullPage?: boolean,
  type: 'sign-in' | 'sign-up',
  automaticRedirect?: boolean,
  extraInfo?: React.ReactNode,
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
  const project = props.mockProject || projectFromHook;
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState<'otp' | 'main'>('main');
  const [otpNonce, setOtpNonce] = useState<string | null>(null);

  useEffect(() => {
    if (props.automaticRedirect) {
      if (user && !props.mockProject) {
        runAsynchronously(props.type === 'sign-in' ? stackApp.redirectToAfterSignIn() : stackApp.redirectToAfterSignUp());
      }
    }
  }, [user, props.mockProject, stackApp, props.automaticRedirect]);

  if (user && !props.mockProject) {
    return <PredefinedMessageCard type='signedIn' fullPage={props.fullPage} />;
  }

  if (props.type === 'sign-up' && !project.config.signUpEnabled) {
    return <PredefinedMessageCard type='signUpDisabled' fullPage={props.fullPage} />;
  }

  const enableSeparator = (project.config.credentialEnabled || project.config.magicLinkEnabled) && project.config.oauthProviders.length > 0;

  const onMagicLinkSuccess = (data: { nonce: string }) => {
    setOtpNonce(data.nonce);
    setCurrentPage('otp');
  };

  switch (currentPage) {
    case 'otp': {
      return <OTPPage
        onBack={() => setCurrentPage('main')}
      />;
    }
    case 'main': {
      return (
        <PageFrame
          title={props.type === 'sign-in' ? t("Sign in to your account") : t("Create a new account")}
          subtitle={props.type === 'sign-in' ? (
            project.config.signUpEnabled && (
              <Typography>
                {t("Don't have an account?")}{" "}
                <StyledLink
                  href={stackApp.urls.signUp}
                  onClick={(e) => {
                  runAsynchronously(stackApp.redirectToSignUp());
                  e.preventDefault();
                  }}
                >
                  {t("Sign up")}
                </StyledLink>
              </Typography>
            )
          ) : (
            <Typography>
              {t("Already have an account?")}{" "}
              <StyledLink
                href={stackApp.urls.signIn}
                onClick={(e) => {
                  runAsynchronously(stackApp.redirectToSignIn());
                  e.preventDefault();
                }}
              >
                {t("Sign in")}
              </StyledLink>
            </Typography>
          )}
          fullPage={!!props.fullPage}
        >
          <OAuthButtonGroup type={props.type} mockProject={props.mockProject} />
          {enableSeparator && <SeparatorWithText text={'Or continue with'} />}
          {project.config.credentialEnabled && project.config.magicLinkEnabled ? (
            <Tabs defaultValue='magic-link'>
              <TabsList className='w-full mb-2'>
                <TabsTrigger value='magic-link' className='flex-1'>{t("Magic Link")}</TabsTrigger>
                <TabsTrigger value='password' className='flex-1'>{t("Password")}</TabsTrigger>
              </TabsList>
              <TabsContent value='magic-link'>
                <MagicLinkSignIn onSuccess={onMagicLinkSuccess} />
              </TabsContent>
              <TabsContent value='password'>
                {props.type === 'sign-up' ? <CredentialSignUp/> : <CredentialSignIn/>}
              </TabsContent>
            </Tabs>
          ) : project.config.credentialEnabled ? (
            props.type === 'sign-up' ? <CredentialSignUp/> : <CredentialSignIn/>
          ) : project.config.magicLinkEnabled ? (
            <MagicLinkSignIn onSuccess={onMagicLinkSuccess} />
          ) : null}
          {props.extraInfo && (
            <div className='flex flex-col items-center text-center text-sm text-gray-500 mt-2'>
              <div>{props.extraInfo}</div>
            </div>
          )}
        </PageFrame>
      );
    }
  }
}
