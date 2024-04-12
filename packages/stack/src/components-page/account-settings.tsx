'use client';

import { useUser } from '..';
import RedirectMessageCard from '../components/redirect-message-card';
import { Text, Divider, Label, Input, Button } from "../components-core";
import UserAvatar from '../components/user-avatar';
import CardFrame from '../components/card-frame';
import { useState } from 'react';
import { runAsynchronously } from '@stackframe/stack-shared/dist/utils/promises';

export default function AccountSettings({ fullPage=false }: { fullPage?: boolean }) {
  const user = useUser();
  const [name, setName] = useState(user?.displayName || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  
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
            <Text size='lg'>{name}</Text>
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
          value={name} 
          onChange={(e) => {
            setName(e.target.value);
            setHasChanged(true);
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label htmlFor='old-password'>Old Password</Label>
        <Input 
          id='old-password' 
          type='password' 
          value={oldPassword} 
          onChange={(e) => {
            setOldPassword(e.target.value);
            setHasChanged(true);
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label htmlFor='new-password'>New Password</Label>
        <Input 
          id='new-password' 
          type='password'
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setHasChanged(true);
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
        <Button variant='primary' disabled={!hasChanged}>Save</Button>
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
