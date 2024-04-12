'use client';

import { PasswordField, useStackApp, useUser } from '..';
import RedirectMessageCard from '../components/redirect-message-card';
import { Text, Divider, Label, Input, Button } from "../components-core";
import UserAvatar from '../components/user-avatar';
import CardFrame from '../components/card-frame';
import { useState } from 'react';
import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';
import FormWarningText from '../components/form-warning';
import { getPasswordError } from '@stackframe/stack-shared/dist/helpers/password';

export default function AccountSettings({ fullPage=false }: { fullPage?: boolean }) {
  const user = useUser();
  const app = useStackApp();
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState<{ displayName: string }>({ displayName: user?.displayName || '' });
  const [userInfoChanged, setUserInfoChanged] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [oldPasswordError, setOldPasswordError] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newPasswordError, setNewPasswordError] = useState<string>('');
  const [emailSent, setEmailSent] = useState(false);
  
  if (!user) {
    return <RedirectMessageCard type='signedOut' fullPage={fullPage} />;
  }

  const inner = (
    <div style={{ padding: fullPage ? '1rem' : 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <Text size="xl" as='h2' style={{ marginBottom: '0.5rem'}}>Account Settings</Text>
        <Text variant='secondary'>Manage your account</Text>
      </div>

      <Divider />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <UserAvatar size={60}/>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text size='lg'>{userInfo.displayName}</Text>
            <Text variant='secondary' size='sm'>{user.primaryEmail}</Text>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label htmlFor='email-validation'>Email Verification</Label>
        {user.primaryEmailVerified ? <Text variant='success'>Verified</Text> : 
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant='warning'>Not Verified</Text>
            <Button 
              variant='primary' 
              size='sm' 
              disabled={emailSent}
              onClick={() => runAsynchronously(async () => {
                await user.sendVerificationEmail();
                setEmailSent(true);
              })}
            >
              {emailSent ? 'Email Sent' : 'Send Email'}
            </Button>
          </div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label htmlFor='display-name'>Name</Label>
        <Input 
          id='display-name' 
          value={userInfo.displayName}
          onChange={(e) => {
            setUserInfo((i) => ({...i, displayName: e.target.value }));
            setUserInfoChanged(true);
          }}
        />
      </div>
      
      {user.authMethod === 'credential' &&
      <>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Label htmlFor='old-password'>Old Password</Label>
          <PasswordField
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
          <Label htmlFor='new-password'>New Password</Label>
          <PasswordField
            id='new-password' 
            value={newPassword} 
            onChange={(e) => {
              setNewPassword(e.target.value);
              setNewPasswordError('');
            }}
          />
          <FormWarningText text={newPasswordError} />
        </div>
      </>}

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem', gap: '1rem' }}>
        <Button 
          variant='primary' 
          disabled={!userInfoChanged && !oldPassword && !newPassword}
          loading={saving}
          onClick={() => runAsynchronously(async () => {
            setSaving(true);
            if (userInfoChanged) {
              await user.update({ displayName: userInfo.displayName });
              setUserInfoChanged(false);
            }
            if (oldPassword && newPassword) {
              const errorMessage = getPasswordError(newPassword);
              if (errorMessage) {
                setNewPasswordError(errorMessage);
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
            setSaving(false);
          })}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <CardFrame fullPage={fullPage}>
        {inner}
      </CardFrame>
    );
  } else {
    return inner;
  }
}
