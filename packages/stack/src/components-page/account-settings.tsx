'use client';

import React from 'react';
import { PasswordInput, useUser } from '..';
import PredefinedMessageCard from '../components/message-cards/predefined-message-card';
import { Container } from "../components-core";
import UserAvatar from '../components/user-avatar';
import { useState } from 'react';
import FormWarningText from '../components/form-warning';
import { getPasswordError } from '@stackframe/stack-shared/dist/helpers/password';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import Typography from '../components/ui/typography';

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
          <Typography type='h3'>{props.title}</Typography>
          <Typography type='label' variant='secondary'>{props.desc}</Typography>
        </div>
      </CardHeader>
      {props.children && <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {props.children}
        </div>
      </CardContent>}
      {props.buttonText && <CardFooter>
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
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
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <UserAvatar user={user} size={50}/>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography>{user?.displayName}</Typography>
          <Typography variant='secondary' type='label'>{user?.primaryEmail}</Typography>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
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

  if (!user?.hasPassword) {
    return null;
  }

  return (
    <SettingSection
      title='Password'
      desc='Change your password here.'
      buttonDisabled={!oldPassword || !newPassword}
      buttonText='Save'
      onButtonClick={async () => {
        if (oldPassword && newPassword) {
          const errorMessage = getPasswordError(newPassword);
          if (errorMessage) {
            setNewPasswordError(errorMessage.message);
          } else {
            const errorCode = await user.updatePassword({ oldPassword, newPassword });
            if (errorCode) {
              setOldPasswordError('Incorrect password');
            } else {
              setOldPassword('');
              setNewPassword('');
            }
          }
        } else if (oldPassword && !newPassword) {
          setNewPasswordError('Please enter a new password');
        } else if (newPassword && !oldPassword) {
          setOldPasswordError('Please enter your old password');
        }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label htmlFor='old-password' className='mb-1'>Old Password</Label>
        <PasswordInput
          id='old-password' 
          value={oldPassword} 
          onChange={(e) => {
            setOldPassword(e.target.value);
            setOldPasswordError('');
          }}
        />
        <FormWarningText text={oldPasswordError} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label htmlFor='new-password' className='mb-1'>New Password</Label>
        <PasswordInput
          id='new-password' 
          value={newPassword} 
          onChange={(e) => {
            setNewPassword(e.target.value);
            setNewPasswordError('');
          }}
        />
        <FormWarningText text={newPasswordError} />
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

export default function AccountSettings({ fullPage=false }: { fullPage?: boolean }) {
  const user = useUser();
  if (!user) {
    return <PredefinedMessageCard type='signedOut' fullPage={fullPage} />;
  }

  const inner = (
    <div style={{ padding: fullPage ? '1rem' : 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
      <Container size='sm'>
        {inner}
      </Container>
    );
  } else {
    return inner;
  }
}
