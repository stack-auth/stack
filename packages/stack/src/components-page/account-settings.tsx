'use client';

import { yupResolver } from "@hookform/resolvers/yup";
import { getPasswordError } from '@stackframe/stack-shared/dist/helpers/password';
import { useAsyncCallback } from '@stackframe/stack-shared/dist/hooks/use-async-callback';
import { yupObject, yupString } from '@stackframe/stack-shared/dist/schema-fields';
import { generateRandomValues } from '@stackframe/stack-shared/dist/utils/crypto';
import { throwErr } from '@stackframe/stack-shared/dist/utils/errors';
import { runAsynchronously, runAsynchronouslyWithAlert } from '@stackframe/stack-shared/dist/utils/promises';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, ActionDialog, Button, EditableText, Input, Label, PasswordInput, Separator, SimpleTooltip, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Typography } from '@stackframe/stack-ui';
import { CirclePlus, Contact, LogOut, ShieldCheck, LucideIcon, Database } from 'lucide-react';
import { TOTPController, createTOTPKeyURI } from "oslo/otp";
import * as QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { CurrentUser, MessageCard, Project, Team, useStackApp, useUser } from '..';
import { FormWarningText } from '../components/elements/form-warning';
import { SidebarLayout } from '../components/elements/sidebar-layout';
import { UserAvatar } from '../components/elements/user-avatar';
import { ProfileImageEditor } from "../components/profile-image-editor";
import { TeamIcon } from '../components/team-icon';
import { MaybeFullPage } from "../components/elements/maybe-full-page";
import { useTranslation } from "../lib/translations";


export function AccountSettings(props: {
  fullPage?: boolean,
  extraItems?: {
    title: string,
    icon: LucideIcon,
    content: React.ReactNode,
    subpath: string,
  }[],
}) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const teams = user.useTeams();
  const stackApp = useStackApp();
  const project = stackApp.useProject();

  return (
    <MaybeFullPage fullPage={!!props.fullPage}>
      <div style={{ alignSelf: 'stretch', flexGrow: 1 }}>
        <SidebarLayout
          items={([
            {
              title: t('My Profile'),
              type: 'item',
              subpath: '/profile',
              icon: Contact,
              content: <ProfileSection/>,
            },
            {
              title: t('Security'),
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
            ...project.config.clientUserDeletionEnabled ? [{
              title: t('Privacy'),
              type: 'item',
              subpath: '/privacy',
              icon: Database,
              content: <PrivacySection />,
            }] as const : [],
            {
              title: t('Sign Out'),
              subpath: '/sign-out',
              type: 'item',
              icon: LogOut,
              content: <SignOutSection />,
            },
            ...(props.extraItems?.map(item => ({
              title: item.title,
              type: 'item',
              subpath: item.subpath,
              icon: item.icon,
              content: item.content,
            } as const)) || []),
            ...(teams.length > 0 || project.config.clientTeamCreationEnabled) ? [{
              title: t('Teams'),
              type: 'divider',
            }] as const : [],
            ...teams.map(team => ({
              title: <div className='flex gap-2 items-center'>
                <TeamIcon team={team}/>
                {team.displayName}
              </div>,
              type: 'item',
              subpath: `/teams/${team.id}`,
              content: (
                <div className="flex flex-col gap-8">
                  <ProfileSettings team={team}/>
                  <ManagementSettings team={team}/>
                  <MemberInvitation team={team}/>
                  <MembersSettings team={team}/>
                  <UserSettings team={team}/>
                </div>
              ),
            } as const)),
            ...project.config.clientTeamCreationEnabled ? [{
              title: t('Create a team'),
              icon: CirclePlus,
              type: 'item',
              subpath: '/team-creation',
              content: <TeamCreation />,
            }] as const : [],
          ] as const).filter((p) => p.type === 'divider' || (p as any).content )}
          title={t("Account Settings")}
          basePath={stackApp.urls.accountSettings}
        />
      </div>
    </MaybeFullPage>
  );
}

function Section(props: { title: string, description?: string, children: React.ReactNode }) {
  return (
    <div className='flex'>
      <div className='flex-1 flex flex-col justify-center'>
        <Typography className='font-medium'>
          {props.title}
        </Typography>
        {props.description && <Typography variant='secondary' type='footnote'>
          {props.description}
        </Typography>}
      </div>
      <div className='flex-1 flex flex-col gap-2'>
        {props.children}
      </div>
    </div>
  );
}

function ProfileSection() {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });

  return (
    <div className='flex flex-col gap-6'>
      <Separator/>
      <Section
        title="User name"
        description="This is a display name and is not used for authentication"
      >
        <EditableText
          value={user.displayName || ''}
          onSave={async (newDisplayName) => {
            await user.update({ displayName: newDisplayName });
          }}/>
      </Section>
      <Separator/>
      <Section
        title="Profile image"
        description="Upload your own image as your avatar"
      >
        <ProfileImageEditor
          user={user}
          onProfileImageUrlChange={async (profileImageUrl) => {
            await user.update({ profileImageUrl });
          }}
        />
      </Section>
      <Separator/>
    </div>
  );
}

function EmailVerificationSection() {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const [emailSent, setEmailSent] = useState(false);

  if (!user.primaryEmail) {
    return null;
  }

  return (
    <>
      <div>
        <Label>{t("Email Verification")}</Label>
        {user.primaryEmailVerified ? (
          <Typography variant='success'>{t("Your email has been verified.")}</Typography>
        ) : (
          <>
            <Typography variant='destructive'>{t("Your email has not been verified.")}</Typography>
            <div className='flex mt-4'>
              <Button
                disabled={emailSent}
                onClick={async () => {
                  await user.sendVerificationEmail();
                  setEmailSent(true);
                }}
              >
                {emailSent ? t("Email sent!") : t("Send Verification Email")}
              </Button>
            </div>
          </>
        )}

      </div>
    </>
  );
}

function PasswordSection() {
  const { t } = useTranslation();

  const passwordSchema = yupObject({
    oldPassword: yupString().required(t('Please enter your old password')),
    newPassword: yupString().required(t('Please enter your password')).test({
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
    newPasswordRepeat: yupString().nullable().oneOf([yup.ref('newPassword'), "", null], t('Passwords do not match')).required(t('Please repeat your password'))
  });

  const user = useUser({ or: "throw" });
  const [changingPassword, setChangingPassword] = useState(false);
  const { register, handleSubmit, setError, formState: { errors }, clearErrors, reset } = useForm({
    resolver: yupResolver(passwordSchema)
  });
  const [alreadyReset, setAlreadyReset] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: yup.InferType<typeof passwordSchema>) => {
    setLoading(true);
    try {
      const { oldPassword, newPassword } = data;
      const error = await user.updatePassword({ oldPassword, newPassword });
      if (error) {
        setError('oldPassword', { type: 'manual', message: t('Incorrect password') });
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
      <Label>{t("Change password")}</Label>
      <div>
        {
          alreadyReset ?
            <Typography variant='success'>{t("Password changed successfully!")}</Typography> :
            !changingPassword ?
              <Button
                variant='secondary'
                onClick={async () => {
                  setChangingPassword(true);
                }}
              >{t("Change Password")}</Button> :
              <form
                onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
                noValidate
              >
                <Label htmlFor="old-password" className="mb-1">{t("Old password")}</Label>
                <Input
                  id="old-password"
                  type="password"
                  {...register("oldPassword")}
                />
                <FormWarningText text={errors.oldPassword?.message?.toString()} />

                <Label htmlFor="new-password" className="mt-4 mb-1">{t("Password")}</Label>
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

                <Label htmlFor="repeat-password" className="mt-4 mb-1">{t("Repeat password")}</Label>
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

                <Button type="submit" className="mt-6" loading={loading}>{t("Change Password")}</Button>
              </form>
        }
      </div>
    </div>
  );
}

function MfaSection() {
  const { t } = useTranslation();
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
        <Label>{t("Multi-factor Authentication")}</Label>

        <div>
          {isEnabled ? (
            <Typography variant="success">{t("Multi-factor authentication is currently enabled.")}</Typography>
          ) : (
            generatedSecret ? (
              <div className='flex flex-col gap-4 items-center'>
                <Typography>{t("Scan this QR code with your authenticator app:")}</Typography>
                <img width={200} height={200} src={qrCodeUrl ?? throwErr("TOTP QR code failed to generate")} alt={t("TOTP multi-factor authentication QR code")} />
                <Typography>{t("Then, enter your six-digit MFA code:")}</Typography>
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
                  <Typography variant="destructive">{t("Incorrect code. Please try again.")}</Typography>
                )}
              </div>
            ) : (
              <Typography variant="destructive">{t("Multi-factor authentication is currently disabled.")}</Typography>
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
            {isEnabled ? t("Disable") : (generatedSecret ? t("Cancel") : t("Enable"))}
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
  const { t } = useTranslation();
  const user = useUser({ or: "throw" });
  return (
    <div className='flex flex-col gap-2'>
      <div>
        <Button
          variant='secondary'
          onClick={() => user.signOut()}
        >{t("Sign Out")}</Button>
      </div>
    </div>
  );
}

function UserSettings(props: { team: Team }) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const [leaving, setLeaving] = useState(false);

  return (
    <div className='flex flex-col gap-2'>
      <div>
        { !leaving ?
          <Button
            variant='secondary'
            onClick={async () => setLeaving(true)}
          >{t("Leave team")}</Button> :
          <div className=''>
            <Typography variant='destructive'>{t("Are you sure you want to leave the team?")}</Typography>
            <div className='flex gap-2'>
              <Button variant='destructive' onClick={async () => {
                await user.leaveTeam(props.team);
                window.location.reload();
              }}>{t("Leave")}</Button>
              <Button variant='secondary' onClick={() => setLeaving(false)}>{t("Cancel")}</Button>
            </div>
          </div>}
      </div>
    </div>
  );
}

function ManagementSettings(props: { team: Team }) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const updateTeamPermission = user.usePermission(props.team, '$update_team');

  if (!updateTeamPermission) {
    return null;
  }

  return (
    <>
      <div className='flex flex-col'>
        <Label>{t("Team display name")}</Label>
        <ProfileImageEditor
          user={props.team}
          onProfileImageUrlChange={async (profileImageUrl) => {
            await props.team.update({ profileImageUrl });
          }}
        />
      </div>

      <div className='flex flex-col'>
        <Label>{t("Team display name")}</Label>
        <EditableText
          value={props.team.displayName}
          onSave={async (newDisplayName) => await props.team.update({ displayName: newDisplayName })}
        />
      </div>
    </>
  );
}

function ProfileSettings(props: { team: Team }) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const profile = user.useTeamProfile(props.team);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <Label className="flex gap-2">{t("User display name")}<SimpleTooltip tooltip="This overwrites your user display name in the account setting" type='info'/></Label>
        <EditableText
          value={profile.displayName || ''}
          onSave={async (newDisplayName) => {
            await profile.update({ displayName: newDisplayName });
          }}/>
      </div>
    </div>
  );
}

function MemberInvitation(props: { team: Team }) {
  const { t } = useTranslation();

  const invitationSchema = yupObject({
    email: yupString().email().required(t('Please enter an email address')),
  });

  const user = useUser({ or: 'redirect' });
  const inviteMemberPermission = user.usePermission(props.team, '$invite_members');

  if (!inviteMemberPermission) {
    return null;
  }

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: yupResolver(invitationSchema)
  });
  const [loading, setLoading] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

  const onSubmit = async (data: yup.InferType<typeof invitationSchema>) => {
    setLoading(true);

    try {
      await props.team.inviteUser({ email: data.email });
      setInvitedEmail(data.email);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInvitedEmail(null);
  }, [watch('email')]);

  return (
    <div>
      <Label>{t("Invite a user to team")}</Label>
      <form
        onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
        noValidate
      >
        <div className="flex flex-col gap-4 md:flex-row">
          <div>
            <Input
              placeholder={t("Email")}
              {...register("email")}
            />
          </div>
          <Button type="submit" loading={loading}>{t("Invite User")}</Button>
        </div>
        <FormWarningText text={errors.email?.message?.toString()} />
        {invitedEmail && <Typography type='label' variant='secondary'>Invited {invitedEmail}</Typography>}
      </form>
    </div>
  );
}


function MembersSettings(props: { team: Team }) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const readMemberPermission = user.usePermission(props.team, '$read_members');
  const inviteMemberPermission = user.usePermission(props.team, '$invite_members');

  if (!readMemberPermission && !inviteMemberPermission) {
    return null;
  }

  const users = props.team.useUsers();

  if (!readMemberPermission) {
    return null;
  }

  return (
    <div>
      <Label>{t("Members")}</Label>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">{t("User")}</TableHead>
            <TableHead className="w-[200px]">{t("Name")}</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TeamCreation() {
  const { t } = useTranslation();

  const teamCreationSchema = yupObject({
    displayName: yupString().required(t("Please enter a team name")),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(teamCreationSchema)
  });
  const app = useStackApp();
  const project = app.useProject();
  const user = useUser({ or: 'redirect' });
  const [loading, setLoading] = useState(false);

  if (!project.config.clientTeamCreationEnabled) {
    return <MessageCard title={t("Team creation is not enabled")} />;
  }

  const onSubmit = async (data: yup.InferType<typeof teamCreationSchema>) => {
    setLoading(true);

    try {
      const team = await user.createTeam({ displayName: data.displayName });
    } finally {
      setLoading(false);
    }
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
              <Label htmlFor="email" className="mb-1">{t("Display name")}</Label>
              <Input
                id="email"
                type="email"
                {...register("displayName")}
              />
            </div>
            <FormWarningText text={errors.displayName?.message?.toString()} />

            <Button type="submit" className="mt-6" loading={loading}>{t("Create")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PrivacySection() {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const app = useStackApp();
  const project = app.useProject();

  return (
    <div className='stack-scope flex flex-col items-stretch'>
      <div className="mb-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>{t("Delete Account")}</AccordionTrigger>
            <AccordionContent>
              <ActionDialog
                trigger={<Button variant="destructive">{t("Delete Account")}</Button>}
                title={t("Delete account")}
                danger
                okButton={{
                  label: t("Delete Account"),
                  onClick: async () => {
                    await user.delete();
                    await app.redirectToHome();
                  }
                }}
                cancelButton
                confirmText={t("I understand this action is IRREVERSIBLE and will delete ALL associated data.")}
              >
                <Typography>
                  {t("Are you sure that you want to delete your account?")}
                </Typography>
              </ActionDialog>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}