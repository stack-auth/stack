'use client';

import { useUser, useStackApp, useDesign } from '..';
import RedirectMessageCard from '../components/redirect-message-card';
import { Text, Container, Divider, Label, Input, Button } from "../components-core";
import React from 'react';
import { SECONDARY_FONT_COLORS } from '../utils/constants';
import UserAvatar from '../components/user-avatar';
import CardFrame from '../components/card-frame';

export default function AccountSettings({ fullPage=false }: { fullPage?: boolean }) {
  const user = useUser();
  const { colorMode } = useDesign();
  
  if (!user) {
    return <RedirectMessageCard type='signedOut' fullPage={fullPage} />;
  }

  const inner = (
    <div style={{ padding: fullPage ? '1rem' : 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <Text size="xl" as='h2' style={{ marginBottom: '0.5rem'}}>Account Setting</Text>
        <Text variant='secondary'>Manage your account</Text>
      </div>

      <Divider />

      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem', marginTop: '1rem' }}>
        <Label htmlFor='profile-image'>Profile Image</Label>
        <div id='profile-image' style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <UserAvatar size={60}/>
          <Button variant='transparent'>Change</Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
        <Label htmlFor='display-name'>Name</Label>
        <Input id='display-name' value={user.displayName || ''}/>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
        <Button variant='primary'>Save</Button>
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
