'use client';

import { yupResolver } from "@hookform/resolvers/yup";
import { getPasswordError } from '@stackframe/stack-shared/dist/helpers/password';
import { useAsyncCallback } from '@stackframe/stack-shared/dist/hooks/use-async-callback';
import { yupObject, yupString } from '@stackframe/stack-shared/dist/schema-fields';
import { generateRandomValues } from '@stackframe/stack-shared/dist/utils/crypto';
import { throwErr } from '@stackframe/stack-shared/dist/utils/errors';
import { runAsynchronously, runAsynchronouslyWithAlert } from '@stackframe/stack-shared/dist/utils/promises';
import { Button, Card, CardContent, CardFooter, CardHeader, Container, EditableText, Input, Label, PasswordInput, SimpleTooltip, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Typography } from '@stackframe/stack-ui';
import { CirclePlus, Contact, Settings, ShieldCheck } from 'lucide-react';
import { useRouter } from "next/navigation";
import { TOTPController, createTOTPKeyURI } from "oslo/otp";
import * as QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { CurrentUser, MessageCard, Project, Team, useStackApp, useUser } from '..';
import { FormWarningText } from '../components/elements/form-warning';
import { SidebarLayout } from '../components/elements/sidebar-layout';
import { UserAvatar } from '../components/elements/user-avatar';
import { TeamIcon } from '../components/team-icon';


export function AccountSettings({ fullPage=false }: { fullPage?: boolean }) {
  const user = useUser({ or: 'redirect' });
  const teams = user.useTeams();
  const project = useStackApp().useProject();

  const inner = <SidebarLayout
    items={([
      {
        title: 'My Profile',
        type: 'item',
        subpath: '/profile',
        icon: Contact,
        content: <ProfileSection/>,
      },
      {
        title: 'Security',
        type: 'item',
        icon: ShieldCheck,
        subpath: '/security',
        content: (
          <div className='flex flex-col gap-8'>
            <EmailVerificationSection />
            <PasswordSection />
            <MfaSection />
          </div>
        ),
      },
      {
        title: 'Settings',
        subpath: '/settings',
        type: 'item',
        icon: Settings,
        content: <SignOutSection />,
      },
      ...(teams.length > 0 || project.config.clientTeamCreationEnabled) ? [{
        title: 'Teams',
        type: 'divider',
      }] : [],
      ...teams.map(team => ({
        title: <div className='flex gap-2 items-center'>
          <TeamIcon team={team}/>
          {team.displayName}
        </div>,
        type: 'item',
        subpath: `/teams/${team.id}`,
        content: <TeamSection team={team}/>,
      } as const)),
      ...project.config.clientTeamCreationEnabled ? [{
        title: 'Create a team',
        icon: CirclePlus,
        type: 'item',
        subpath: '/team-creation',
        content: <TeamCreation />,
      }] : [],
    ] as const).filter((p) => p.type === 'divider' || (p as any).content )}
    title='Account Settings'
    basePath='/handler/account-settings'
  />;

  if (fullPage) {
    return (
      <Container size={1000} className='stack-scope'>
        {inner}
      </Container>
    );
  } else {
    return inner;
  }
}

function ProfileSection() {
  const user = useUser({ or: 'redirect' });

  return (
    <div>
      <div>
        <Label>Display name</Label>
        <EditableText value={user.displayName || ''} onSave={async (newDisplayName) => {
          await user.update({ displayName: newDisplayName });
        }}/>
      </div>
    </div>
  );
}

function EmailVerificationSection() {
  const user = useUser({ or: 'redirect' });
  const [emailSent, setEmailSent] = useState(false);

  return (
    <>
      <div>
        <Label>Email Verification</Label>
        {user.primaryEmailVerified ? (
          <Typography variant='success'>Your email has been verified.</Typography>
        ) : (
          <Typography variant='destructive'>Your email has not been verified.</Typography>
        )}
        <div className='flex mt-4'>
          <Button
            disabled={emailSent}
            onClick={async () => {
              await user.sendVerificationEmail();
            setEmailSent(true);
            }}
          >
            {emailSent ? 'Email sent!' : 'Send Verification Email'}
          </Button>
        </div>
      </div>
    </>
  );
}


function PasswordSection() {
  const schema = yupObject({
    oldPassword: yupString().required('Please enter your old password'),
    newPassword: yupString().required('Please enter your password').test({
      name: 'is-valid-password',
      test: (value, ctx) => {
        const error = getPasswordError(value);
        if (error) {
          return ctx.createError({ message: error.message });
        } else {
          return true;
        }
      }
    }),
    newPasswordRepeat: yupString().nullable().oneOf([yup.ref('newPassword'), "", null], 'Passwords do not match').required('Please repeat your password')
  });

  const user = useUser({ or: "throw" });
  const [changingPassword, setChangingPassword] = useState(false);
  const { register, handleSubmit, setError, formState: { errors }, clearErrors, reset } = useForm({
    resolver: yupResolver(schema)
  });
  const [alreadyReset, setAlreadyReset] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);
    try {
      const { oldPassword, newPassword } = data;
      const error = await user.updatePassword({ oldPassword, newPassword });
      if (error) {
        setError('oldPassword', { type: 'manual', message: 'Incorrect password' });
      } else {
        reset();
        setAlreadyReset(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const registerPassword = register('newPassword');
  const registerPasswordRepeat = register('newPasswordRepeat');

  if (!user.hasPassword) {
    return null;
  }

  return (
    <div>
      <Label>Change password</Label>
      <div>
        {
          alreadyReset ?
            <Typography variant='success'>Password changed successfully!</Typography> :
            !changingPassword ?
              <Button
                variant='secondary'
                onClick={async () => {
                  setChangingPassword(true);
                }}
              >
                Change Password
              </Button> :
              <form
                onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
                noValidate
              >
                <Label htmlFor="old-password" className="mb-1">Old password</Label>
                <Input
                  id="old-password"
                  type="password"
                  {...register('oldPassword')}
                />
                <FormWarningText text={errors.oldPassword?.message?.toString()} />

                <Label htmlFor="new-password" className="mt-4 mb-1">Password</Label>
                <PasswordInput
                  id="new-password"
                  {...registerPassword}
                  onChange={(e) => {
                    clearErrors('newPassword');
                    clearErrors('newPasswordRepeat');
                    runAsynchronously(registerPassword.onChange(e));
                  }}
                />
                <FormWarningText text={errors.newPassword?.message?.toString()} />

                <Label htmlFor="repeat-password" className="mt-4 mb-1">Repeat password</Label>
                <PasswordInput
                  id="repeat-password"
                  {...registerPasswordRepeat}
                  onChange={(e) => {
                    clearErrors('newPassword');
                    clearErrors('newPasswordRepeat');
                    runAsynchronously(registerPasswordRepeat.onChange(e));
                  }}
                />
                <FormWarningText text={errors.newPasswordRepeat?.message?.toString()} />

                <Button type="submit" className="mt-6" loading={loading}>
                  Change Password
                </Button>
              </form>
        }
      </div>
    </div>
  );
}

function MfaSection() {
  const project = useStackApp().useProject();
  const user = useUser({ or: "throw" });
  const [generatedSecret, setGeneratedSecret] = useState<Uint8Array | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState<string>("");
  const [isMaybeWrong, setIsMaybeWrong] = useState(false);
  const isEnabled = user.isMultiFactorRequired;

  const [handleSubmit, isLoading] = useAsyncCallback(async () => {
    await user.update({
      totpMultiFactorSecret: generatedSecret,
    });
    setGeneratedSecret(null);
    setQrCodeUrl(null);
    setMfaCode("");
  }, [generatedSecret, user]);

  useEffect(() => {
    setIsMaybeWrong(false);
    runAsynchronouslyWithAlert(async () => {
      if (generatedSecret && await new TOTPController().verify(mfaCode, generatedSecret)) {
        await handleSubmit();
      }
      setIsMaybeWrong(true);
    });
  }, [mfaCode, generatedSecret, handleSubmit]);

  return (
    <div>
      <div>
        <Label>Multi-factor Authentication</Label>

        <div>
          {isEnabled ? (
            <Typography variant="success">Multi-factor authentication is currently enabled.</Typography>
          ) : (
            generatedSecret ? (
              <div className='flex flex-col gap-4 items-center'>
                <Typography>Scan this QR code with your authenticator app:</Typography>
                <img width={200} height={200} src={qrCodeUrl ?? throwErr("TOTP QR code failed to generate")} alt="TOTP multi-factor authentication QR code" />
                <Typography>Then, enter your six-digit MFA code:</Typography>
                <Input
                  value={mfaCode}
                  onChange={(e) => {
                setIsMaybeWrong(false);
                setMfaCode(e.target.value);
                  }}
                  placeholder="123456"
                  maxLength={6}
                  disabled={isLoading}
                />
                {isMaybeWrong && mfaCode.length === 6 && (
                  <Typography variant="destructive">Incorrect code. Please try again.</Typography>
                )}
              </div>
            ) : (
              <Typography variant="destructive">Multi-factor authentication is currently disabled.</Typography>
            )
          )}

          <Button
            className="mt-4"
            variant={isEnabled ? 'secondary' : 'default'}
            onClick={async () => {
              if (isEnabled) {
                await user.update({
                  totpMultiFactorSecret: null,
                });
              } else if (!generatedSecret) {
                const secret = generateRandomValues(new Uint8Array(20));
                setQrCodeUrl(await generateTotpQrCode(project, user, secret));
                setGeneratedSecret(secret);
              } else {
                setGeneratedSecret(null);
                setQrCodeUrl(null);
                setMfaCode("");
              }
            }}
          >
            {isEnabled ? 'Disable' : (generatedSecret ? 'Cancel' : 'Enable')}
          </Button>
        </div>
      </div>
    </div>
  );
}

async function generateTotpQrCode(project: Project, user: CurrentUser, secret: Uint8Array) {
  const uri = createTOTPKeyURI(project.displayName, user.primaryEmail ?? user.id, secret);
  return await QRCode.toDataURL(uri) as any;
}

function SignOutSection() {
  const user = useUser({ or: "throw" });
  return (
    <div className='flex flex-col gap-2'>
      <div>
        <Button
          variant='secondary'
          onClick={() => user.signOut()}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function TeamSection(props: { team: Team }) {
  return (<div className="flex flex-col gap-8">
    {profileSettings(props)}
    {managementSettings(props)}
    {membersSettings(props)}
    {userSettings(props)}
  </div>);
}

function userSettings(props: { team: Team }) {
  const app = useStackApp();
  const user = useUser({ or: 'redirect' });
  const [leaving, setLeaving] = useState(false);

  return (
    <div className='flex flex-col gap-2'>
      <div>
        { !leaving ?
          <Button
            variant='secondary'
            onClick={async () => setLeaving(true)}
          >
          Leave team
          </Button> :
          <div className=''>
            <Typography variant='destructive'>Are you sure you want to leave the team?</Typography>
            <div className='flex gap-2'>
              <Button variant='destructive' onClick={async () => {
                await user.leaveTeam(props.team);
                window.location.reload();
              }}>
                Leave
              </Button>
              <Button variant='secondary' onClick={() => setLeaving(false)}>
                Cancel
              </Button>
            </div>
          </div>}
      </div>
    </div>
  );
}

function managementSettings(props: { team: Team }) {
  const user = useUser({ or: 'redirect' });
  const updateTeamPermission = user.usePermission(props.team, '$update_team');

  if (!updateTeamPermission) {
    return null;
  }

  return (
    <>
      <div>
        <Label>Team display name</Label>
        <EditableText value={props.team.displayName} onSave={() => {}}/>
      </div>
    </>
  );
}

function profileSettings(props: { team: Team }) {
  const user = useUser({ or: 'redirect' });
  const profile = user.useTeamProfile(props.team);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <Label className="flex gap-2">User display name <SimpleTooltip tooltip="This overwrites your user display name in the account setting" type='info'/></Label>
        <EditableText
          value={profile.displayName || ''}
          onSave={async (newDisplayName) => {
            await profile.update({ displayName: newDisplayName });
          }}/>
      </div>
    </div>
  );
}


function membersSettings(props: { team: Team }) {
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const user = useUser({ or: 'redirect' });
  const removeMemberPermission = user.usePermission(props.team, '$remove_members');
  const readMemberPermission = user.usePermission(props.team, '$read_members');
  const inviteMemberPermission = user.usePermission(props.team, '$invite_members');
  const [email, setEmail] = useState('');
  const [invited, setInvited] = useState(false);

  if (!readMemberPermission && !inviteMemberPermission) {
    return null;
  }

  const users = props.team.useUsers();

  useEffect(() => {
    if (invited && email) {
      setInvited(false);
    }
  }, [email]);

  return (
    <>
      <div className="flex flex-col gap-8">
        {inviteMemberPermission &&
          <div>
            <Label>Invite a user to team</Label>
            <div className="flex flex-col gap-4 md:flex-row">
              <div>
                <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
              </div>
              <Button onClick={async () => {
                await props.team.inviteUser({ email });
                setEmail('');
                setInvited(true);
              }}>Invite User</Button>
            </div>
            {invited && <Typography type='label' variant='secondary'>User invited.</Typography>}
          </div>}
        {readMemberPermission &&
        <div>
          <Label>Members</Label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">User</TableHead>
                <TableHead className="w-[200px]">Name</TableHead>
                {/* {removeMemberPermission && <TableHead className="w-[100px]">Actions</TableHead>} */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(({ id, teamProfile }, i) => (
                <TableRow key={id}>
                  <TableCell>
                    <UserAvatar user={teamProfile}/>
                  </TableCell>
                  <TableCell>
                    <Typography>{teamProfile.displayName}</Typography>
                  </TableCell>
                  {/* {removeMemberPermission && <TableCell>
                    <ActionCell items={[
                      { item: 'Remove', onClick: () => setRemoveModalOpen(true), danger: true },
                    ]}/>
                    <RemoveMemberDialog open={removeModalOpen} onOpenChange={setRemoveModalOpen} />
                  </TableCell>} */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>}
      </div>
    </>
  );
}

function TeamCreationSection(props: { team: Team }) {
  return (
    <div>
      <Label>Team display name</Label>
      <EditableText value={props.team.displayName} onSave={() => {}}/>
    </div>
  );
}

const schema = yupObject({
  displayName: yupString().required('Please enter a team name'),
});

export function TeamCreation(props: { fullPage?: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  const app = useStackApp();
  const project = app.useProject();
  const user = useUser({ or: 'redirect' });
  const [loading, setLoading] = useState(false);

  if (!project.config.clientTeamCreationEnabled) {
    return <MessageCard title='Team creation is not enabled' />;
  }

  const onSubmit = async (data: yup.InferType<typeof schema>) => {
    setLoading(true);

    try {
      const team = await user.createTeam({ displayName: data.displayName });
    } finally {
      setLoading(false);
    }

    window.location.reload();
  };

  return (
    <div className='stack-scope flex flex-col items-stretch'>
      <div className="mb-6">
        <form
          className="flex flex-col items-stretch stack-scope"
          onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
          noValidate
        >
          <div className="flex items-end gap-4">
            <div>
              <Label htmlFor="email" className="mb-1">Display name</Label>
              <Input
                id="email"
                type="email"
                {...register('displayName')}
              />
            </div>
            <FormWarningText text={errors.displayName?.message?.toString()} />

            <Button type="submit" className="mt-6" loading={loading}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}