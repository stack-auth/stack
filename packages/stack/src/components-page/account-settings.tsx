'use client';

import React, {useEffect, useRef } from 'react';
import { PasswordField, useUser } from '..';
import RedirectMessageCard from '../components/redirect-message-card';
import { Text, Label, Input, Button, Card, CardHeader, CardContent, CardFooter, Container } from "../components-core";
import UserAvatar from '../components/user-avatar';
import { useState } from 'react';
import FormWarningText from '../components/form-warning';
import { getPasswordError } from '@stackframe/stack-shared/dist/helpers/password';
import {Pencil2Icon} from "@radix-ui/react-icons"
import {Slider,Modal, Sheet} from '@mui/joy';
import AvatarEditor from "react-avatar-editor";
import imageCompression from 'browser-image-compression';

function SettingSection(props: {
  title: string, 
  desc: string, 
  buttonText?: string, 
  buttonDisabled?: boolean,
  onButtonClick?: React.ComponentProps<typeof Button>["onClick"],
  buttonVariant?: 'primary' | 'secondary',
  children?: React.ReactNode, 
}) {
  return (
    <Card>
      <CardHeader>
        <Text as='h3' style={{ fontWeight: 500 }}>{props.title}</Text>
        <Text variant='secondary' size='sm'>{props.desc}</Text>
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
  const [userInfo, setUserInfo] = useState<{ displayName: string, uploadedProfileImage: string }>({ displayName: user?.displayName || '' , uploadedProfileImage:""});
  const [changed, setChanged] = useState(false);
  const [open,setOpen]=useState(false);
  const [slideValue, setSlideValue] = useState(10);
  const cropRef = useRef<AvatarEditor>(null);
  const [uploadAvatar,setUploadAvatar]=useState('');
  const fileUploadRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if(user){
      user.getProfileImage(user.id)
      .then(uploadedImage => {
        if (uploadedImage) {
          setUploadAvatar(uploadedImage.data.userProfileImage);
          setUserInfo((i) => ({...i, uploadedProfileImage: uploadedImage.data.userProfileImage}));
        } else {
          console.log('User profile image not found');
        }
      })
      }
  },[])
  const handleImageUpload = () => {
    if (fileUploadRef.current) {
    fileUploadRef.current.click();
    }
  }
  const uploadImageDisplay = async () => {
    if (fileUploadRef.current?.files) {
    const uploadedFile = fileUploadRef.current.files[0];
    const maxSizeInBytes = (1 * 1024 * 1024)/2; // 500 KB
    if (uploadedFile) {
      let options={}
      if(uploadedFile?.size < maxSizeInBytes){
       options={
        fileType:"image/jpeg",
      }
      }
    else{
       options = {
        maxSizeMB: 0.5,
        fileType:"image/jpeg",
      }
    }
    const compressedFile = await imageCompression(uploadedFile, options);
    const fileData = await readFileAsDataURL(compressedFile);
    setUploadAvatar(fileData);
    setOpen(true);
    };
    }
}

const readFileAsDataURL = (file: File): Promise<string>=> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
const handleSliderChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  setSlideValue(Number(target.value));
};
const handleSave = async () => {
  if (cropRef?.current) {
    const dataUrl = cropRef.current.getImage().toDataURL('image/jpeg');
    const result = await fetch(dataUrl);
    const blob = await result.blob();
    setUploadAvatar(URL.createObjectURL(blob));
    setOpen(false);
    setUserInfo((i) => ({...i, uploadedProfileImage: dataUrl}));
    setUploadAvatar(dataUrl);
    setChanged(true);
    setSlideValue(10);
  }
};
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
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <UserAvatar user={user} size={50} uploadAvatar={uploadAvatar}/>
        <input type="file" id="file" ref={fileUploadRef} accept="image/*" onChange={uploadImageDisplay} hidden/>
        <div 
          onClick={handleImageUpload} 
          style={{ 
            position: 'absolute', 
            bottom: 0, 
            right: 0, 
            cursor: 'pointer',
            border: 'none', 
          }}
        >
          <Pencil2Icon className="h-4 w-4"/>
        </div>
      </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text>{user?.displayName}</Text>
          <Text variant='secondary' size='sm'>{user?.primaryEmail}</Text>
        </div>
      </div>
      <Modal
      aria-labelledby="modal-title"
      aria-describedby="modal-desc"
      open={open}
      onClose={() => setOpen(false)}
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',  
        outline: 'none' 
      }}
    >
      <Sheet
        variant="outlined"
        sx={{
          maxWidth: 500,
          borderRadius: 'md',
          p: 3,
          boxShadow: 'lg',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          textAlign: 'center' // Center text and inline elements inside the Sheet
        }}
      >
        <AvatarEditor
          ref={cropRef}
          image={uploadAvatar || ""}
          style={{ width: "100%", height: "100%", outline: 'none' }}
          borderRadius={150}
          color={[0, 0, 0, 0.72]}
          scale={slideValue / 10}
          rotate={0}
        />
        <Slider
          min={10}
          max={50}
          sx={{
            margin: "20px auto", // Adds vertical spacing and auto left-right margins to center
            width: "80%",
            color: "cyan",
            display: 'block' // Ensures it behaves like a block element, allowing margin auto to work
          }}
          defaultValue={slideValue}
          value={slideValue}
          onChange={handleSliderChange}
        />
            <Button variant="warning" onClick={() => setOpen(false)} style={{marginRight: '120px'}}>
            Cancel
          </Button>
          <Button variant="primary"
            onClick={handleSave}  style={{marginLeft: '120px'}}
          >
            Done
          </Button>
      </Sheet>
      </Modal>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Label htmlFor='display-name'>Display Name</Label>
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
        <Text variant='success'>Your email has been verified</Text> : 
        <Text variant='warning'>Your email has not been verified</Text>}
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
            const errorCode = await user?.updatePassword({ oldPassword, newPassword });
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

// function CustomModal({ open, setOpen, handleSave, uploadAvatar, slideValue, handleSliderChange }: {
//   open: boolean;
//   setOpen: (open: boolean) => void;
//   handleSave: () => void;
//   uploadAvatar: string; // Or specify the appropriate type
//   slideValue: number;
//   handleSliderChange: (event: React.ChangeEvent<{}>, value: number | number[]) => void;
// }){

// }

export default function AccountSettings({ fullPage=false }: { fullPage?: boolean }) {
  const user = useUser();
  if (!user) {
    return <RedirectMessageCard type='signedOut' fullPage={fullPage} />;
  }

  const inner = (
    <div style={{ padding: fullPage ? '1rem' : 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <Text size="xl" as='h1' style={{ fontWeight: '600' }}>Account Settings</Text>
        <Text variant='secondary' size='sm'>Manage your account</Text>
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
