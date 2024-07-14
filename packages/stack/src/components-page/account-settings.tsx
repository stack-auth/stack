'use client';

import React from 'react';
import { useUser } from '..';
import { PredefinedMessageCard } from '../components/message-cards/predefined-message-card';
import { UserAvatar } from '../components/elements/user-avatar';
import { useState } from 'react';
import { FormWarningText } from '../components/elements/form-warning';
import { getPasswordError } from '@stackframe/stack-shared/dist/helpers/password';
import { Button, Card, CardContent, CardFooter, CardHeader, Container, Input, Label, PasswordInput, Typography, cn } from '@stackframe/stack-ui';

function SettingSection(props: {
  title: string, 
  desc: string, 
  buttonText?: string, 
  buttonDisabled?: boolean,
  onButtonClick?: React.ComponentProps<typeof Button>["onClick"],
  buttonVariant?: 'default' | 'secondary',
  children?: React.ReactNode, 
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <Typography type='h4'>{props.title}</Typography>
          <Typography type='label' variant='secondary'>{props.desc}</Typography>
        </div>
      </CardHeader>
      {props.children && <CardContent>
        <div className='flex flex-col gap-4'>
          {props.children}
        </div>
      </CardContent>}
      {props.buttonText && <CardFooter>
        <div className='flex justify-end w-full'>
          <Button
            disabled={props.buttonDisabled}
            onClick={props.onButtonClick}
            variant={props.buttonVariant}
          >
            {props.buttonText}
          </Button>
        </div>
      </CardFooter>}
    </Card>
  );
}

function ProfileSection() {
  const user = useUser();
  const [userInfo, setUserInfo] = useState<{ displayName: string }>({ displayName: user?.displayName || '' });
  const [changed, setChanged] = useState(false);

  return (
    <SettingSection
      title='Profile'
      desc='Your profile information'
      buttonDisabled={!changed}
      buttonText='Save'
      onButtonClick={async () => {
        await user?.update(userInfo);
        setChanged(false);
      }}
    >
      <div className='flex gap-4 items-center'>
        <UserAvatar user={user} size={50}/>
        <div className='flex flex-col'>
          <Typography>{user?.displayName}</Typography>
          <Typography variant='secondary' type='label'>{user?.primaryEmail}</Typography>
        </div>
      </div>

      <div className='flex flex-col'>
        <Label htmlFor='display-name' className='mb-1'>Display Name</Label>
        <Input
          id='display-name'
          value={userInfo.displayName}
          onChange={(e) => {
            setUserInfo((i) => ({...i, displayName: e.target.value }));
            setChanged(true);
          }}
        />
      </div>
    </SettingSection>
  );
}

function EmailVerificationSection() {
  const user = useUser();
  const [emailSent, setEmailSent] = useState(false);

  return (
    <SettingSection
      title='Email Verification'
      desc='We want to make sure that you own the email address.'
      buttonDisabled={emailSent}
      buttonText={
        !user?.primaryEmailVerified ? 
          emailSent ? 
            'Email sent!' : 
            'Send Email'
          : undefined
      }
      onButtonClick={async () => {
        await user?.sendVerificationEmail();
        setEmailSent(true);
      }}
    >
      {user?.primaryEmailVerified ? 
        <Typography variant='success'>Your email has been verified</Typography> :
        <Typography variant='destructive'>Your email has not been verified</Typography>}
    </SettingSection>
  );
}

function PasswordSection() {
  const user = useUser();
  const [oldPassword, setOldPassword] = useState<string>('');
  const [oldPasswordError, setOldPasswordError] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newPasswordError, setNewPasswordError] = useState<string>('');
  const [repeatNewPassword, setRepeatNewPassword] = useState<string>('');
  const [repeatNewPasswordError, setRepeatNewPasswordError] = useState<string>('');
  const [passwordChanged, setPasswordChanged] = useState(false);

  if (!user?.hasPassword) {
    return null;
  }

  return (
    <SettingSection
      title='Password'
      desc='Change your password here.'
      buttonDisabled={passwordChanged}
      buttonText={passwordChanged ? "Password changed!" : 'Update Password'}
      onButtonClick={async () => {
        setOldPasswordError('');
        setNewPasswordError('');
        setRepeatNewPasswordError('');
        if (!oldPassword) {
          setOldPasswordError('Please enter your old password');
          return;
        } else if (!newPassword) {
          setNewPasswordError('Please enter a new password');
          return;
        } else if (!repeatNewPassword) {
            setRepeatNewPasswordError('Please repeat your new password');
            return;
        } else {
          const errorMessage = getPasswordError(newPassword);
          if (errorMessage) {
            setNewPasswordError(errorMessage.message);
          } else {
            if (newPassword !== repeatNewPassword) {
              setRepeatNewPasswordError('Passwords do not match');
              return;
            }
            const errorCode = await user.updatePassword({ oldPassword, newPassword });
            if (errorCode) {
              setOldPasswordError('Incorrect password');
            } else {
              setOldPassword('');
              setNewPassword('');
              setRepeatNewPassword('');
              setPasswordChanged(true);
            }
          }
        }
      }}
    >
      <div className='flex flex-col'>
        <Label htmlFor='old-password' className='mb-1'>Old Password</Label>
        <PasswordInput
          id='old-password' 
          value={oldPassword} 
          onChange={(e) => {
            setOldPassword(e.target.value);
            setOldPasswordError('');
            setPasswordChanged(false);
          }}
        />
        <FormWarningText text={oldPasswordError} />
      </div>
      <div className='flex flex-col'>
        <Label htmlFor='new-password' className='mb-1'>New Password</Label>
        <PasswordInput
          id='new-password' 
          value={newPassword} 
          onChange={(e) => {
            setNewPassword(e.target.value);
            setNewPasswordError('');
            setPasswordChanged(false);
          }}
        />
        <FormWarningText text={newPasswordError} />
      </div>
      <div className='flex flex-col'>
        <Label htmlFor='repeat-new-password' className='mb-1'>Repeat New Password</Label>
        <PasswordInput
          id='repeat-new-password' 
          value={repeatNewPassword} 
          onChange={(e) => {
            setRepeatNewPassword(e.target.value);
            setRepeatNewPasswordError('');
            setPasswordChanged(false);
          }}
        />
        <FormWarningText text={repeatNewPasswordError} />
      </div>
    </SettingSection>
  );
}

function SignOutSection() {
  const user = useUser();
  return (
    <SettingSection
      title='Sign out'
      desc='Sign out of your account on this device.'
      buttonVariant='secondary'
      buttonText='Sign Out'
      onButtonClick={() => user?.signOut()}
    >
    </SettingSection>
  );
}

export function AccountSettings({ fullPage=false }: { fullPage?: boolean }) {
  const user = useUser();
  if (!user) {
    return <PredefinedMessageCard type='signedOut' fullPage={fullPage} />;
  }

  const inner = (
    <div className={cn(fullPage ? 'p-4' : '', 'flex flex-col gap-4')}>
      <div>
        <Typography type='h2'>Account Settings</Typography>
        <Typography variant='secondary' type='label'>Manage your account</Typography>
      </div>
      
      <ProfileSection />
      <EmailVerificationSection />
      <PasswordSection />
      <SignOutSection />
    </div>
  );

  if (fullPage) {
    return (
      <Container size={600} className='stack-scope'>
        {inner}
      </Container>
    );
  } else {
    return inner;
  }
}
