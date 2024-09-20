'use client';

import { yupResolver } from "@hookform/resolvers/yup";
import { getPasswordError } from '@stackframe/stack-shared/dist/helpers/password';
import { useAsyncCallback } from '@stackframe/stack-shared/dist/hooks/use-async-callback';
import { yupObject, yupString } from '@stackframe/stack-shared/dist/schema-fields';
import { generateRandomValues } from '@stackframe/stack-shared/dist/utils/crypto';
import { throwErr } from '@stackframe/stack-shared/dist/utils/errors';
import { runAsynchronously, runAsynchronouslyWithAlert } from '@stackframe/stack-shared/dist/utils/promises';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, EditableText, Input, Label, PasswordInput, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Typography } from '@stackframe/stack-ui';
import { CirclePlus, Contact, LucideIcon, Settings, ShieldCheck } from 'lucide-react';
import { useRouter } from "next/navigation";
import { TOTPController, createTOTPKeyURI } from "oslo/otp";
import * as QRCode from 'qrcode';
import React, { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { CurrentUser, MessageCard, Project, Team, useStackApp, useUser } from '..';
import { FormWarningText } from '../components/elements/form-warning';
import { MaybeFullPage } from "../components/elements/maybe-full-page";
import { SidebarLayout } from '../components/elements/sidebar-layout';
import { UserAvatar } from '../components/elements/user-avatar';
import { ProfileImageEditor } from "../components/profile-image-editor";
import { TeamIcon } from '../components/team-icon';
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
              content: <ProfilePage/>,
            },
            {
              title: t('Security'),
              type: 'item',
              subpath: '/security',
              icon: ShieldCheck,
              content: <SecurityPage/>,
            },
            {
              title: t('Settings'),
              type: 'item',
              subpath: '/settings',
              icon: Settings,
              content: <SettingsPage/>,
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
              content: <TeamPage team={team}/>,
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
    <div className='flex flex-col sm:flex-row gap-2'>
      <div className='sm:flex-1 flex flex-col justify-center'>
        <Typography className='font-medium'>
          {props.title}
        </Typography>
        {props.description && <Typography variant='secondary' type='footnote'>
          {props.description}
        </Typography>}
      </div>
      <div className='sm:flex-1 flex flex-col gap-2'>
        {props.children}
      </div>
    </div>
  );
}

function PageLayout(props: { children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-6'>
      <Separator/>
      {React.Children.map(props.children, (child) => (
        child && (
          <>
            {child}
            <Separator/>
          </>
        )
      ))}
    </div>
  );
}

function ProfilePage() {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });

  return (
    <PageLayout>
      <Section
        title={t("User name")}
        description={t("This is a display name and is not used for authentication")}
      >
        <EditableText
          value={user.displayName || ''}
          onSave={async (newDisplayName) => {
            await user.update({ displayName: newDisplayName });
          }}/>
      </Section>
      <Section
        title={t("Profile image")}
        description={t("Upload your own image as your avatar")}
      >
        <ProfileImageEditor
          user={user}
          onProfileImageUrlChange={async (profileImageUrl) => {
            await user.update({ profileImageUrl });
          }}
        />
      </Section>
    </PageLayout>
  );
}

function SecurityPage() {
  const emailVerificationSection = useEmailVerificationSection();
  const passwordSection = usePasswordSection();
  const mfaSection = useMfaSection();

  return (
    <PageLayout>
      {emailVerificationSection}
      {passwordSection}
      {mfaSection}
    </PageLayout>
  );
}

function SettingsPage() {
  const deleteAccountSection = useDeleteAccountSection();
  const signOutSection = useSignOutSection();

  return (
    <PageLayout>
      {deleteAccountSection}
      {signOutSection}
    </PageLayout>
  );
}

function useEmailVerificationSection() {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const [emailSent, setEmailSent] = useState(false);

  if (!user.primaryEmail) {
    return null;
  }

  return (
    <Section
      title={t("Email Verification")}
      description={t("Verify your email address to secure your account")}
    >
      <div>
        {user.primaryEmailVerified ? (
          <Typography variant='success'>{t("Your email has been verified.")}</Typography>
        ) : (
          <div className='flex'>
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
        )}
      </div>
    </Section>
  );
}

function usePasswordSection() {
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

function useMfaSection() {
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
    <Section
      title={t("Multi-factor Authentication")}
      description={isEnabled
        ? t("Multi-factor authentication is currently enabled.")
        : t("Multi-factor authentication is currently disabled.")}
    >
      <div className='flex flex-col gap-4'>
        {!isEnabled && generatedSecret && (
          <>
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
            <div className='flex'>
              <Button
                variant='secondary'
                onClick={() => {
                  setGeneratedSecret(null);
                  setQrCodeUrl(null);
                  setMfaCode("");
                }}
              >
                {t("Cancel")}
              </Button>
            </div>
          </>
        )}
        <div className='flex gap-2'>
          {isEnabled ? (
            <Button
              variant='secondary'
              onClick={async () => {
                await user.update({
                  totpMultiFactorSecret: null,
                });
              }}
            >
              {t("Disable")}
            </Button>
          ) : !generatedSecret && (
            <Button
              variant='default'
              onClick={async () => {
                const secret = generateRandomValues(new Uint8Array(20));
                setQrCodeUrl(await generateTotpQrCode(project, user, secret));
                setGeneratedSecret(secret);
              }}
            >
              {t("Enable")}
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}

async function generateTotpQrCode(project: Project, user: CurrentUser, secret: Uint8Array) {
  const uri = createTOTPKeyURI(project.displayName, user.primaryEmail ?? user.id, secret);
  return await QRCode.toDataURL(uri) as any;
}

function useSignOutSection() {
  const { t } = useTranslation();
  const user = useUser({ or: "throw" });

  return (
    <Section
      title={t("Sign out")}
      description={t("End your current session")}
    >
      <div>
        <Button
          variant='secondary'
          onClick={() => user.signOut()}
        >
          {t("Sign out")}
        </Button>
      </div>
    </Section>
  );
}

function TeamPage(props: { team: Team }) {
  const teamUserProfileSection = useTeamUserProfileSection(props);
  const teamProfileImageSection = useTeamProfileImageSection(props);
  const teamDisplayNameSection = useTeamDisplayNameSection(props);
  const leaveTeamSection = useLeaveTeamSection(props);
  const memberInvitationSection = useMemberInvitationSection(props);
  const memberListSection = useMemberListSection(props);

  return (
    <PageLayout>
      {teamUserProfileSection}
      {memberInvitationSection}
      {memberListSection}
      {teamProfileImageSection}
      {teamDisplayNameSection}
      {leaveTeamSection}
    </PageLayout>
  );
}

function useLeaveTeamSection(props: { team: Team }) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const [leaving, setLeaving] = useState(false);

  return (
    <Section
      title={t("Leave Team")}
      description={t("leave this team and remove your team profile")}
    >
      {!leaving ? (
        <div>
          <Button
            variant='secondary'
            onClick={() => setLeaving(true)}
          >
            {t("Leave team")}
          </Button>
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          <Typography variant='destructive'>
            {t("Are you sure you want to leave the team?")}
          </Typography>
          <div className='flex gap-2'>
            <Button
              variant='destructive'
              onClick={async () => {
                await user.leaveTeam(props.team);
                window.location.reload();
              }}
            >
              {t("Leave")}
            </Button>
            <Button
              variant='secondary'
              onClick={() => setLeaving(false)}
            >
              {t("Cancel")}
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}

function useTeamProfileImageSection(props: { team: Team }) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const updateTeamPermission = user.usePermission(props.team, '$update_team');

  if (!updateTeamPermission) {
    return null;
  }

  return (
    <Section
      title={t("Team profile image")}
      description={t("Upload an image for your team")}
    >
      <ProfileImageEditor
        user={props.team}
        onProfileImageUrlChange={async (profileImageUrl) => {
          await props.team.update({ profileImageUrl });
        }}
      />
    </Section>
  );
}

function useTeamDisplayNameSection(props: { team: Team }) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const updateTeamPermission = user.usePermission(props.team, '$update_team');

  if (!updateTeamPermission) {
    return null;
  }

  return (
    <Section
      title={t("Team display name")}
      description={t("Change the display name of your team")}
    >
      <EditableText
        value={props.team.displayName}
        onSave={async (newDisplayName) => await props.team.update({ displayName: newDisplayName })}
      />
    </Section>
  );
}

function useTeamUserProfileSection(props: { team: Team }) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const profile = user.useTeamProfile(props.team);

  return (
    <Section
      title={t("Team user name")}
      description={t("Overwrite your user display name in this team")}
    >
      <EditableText
        value={profile.displayName || ''}
        onSave={async (newDisplayName) => {
          await profile.update({ displayName: newDisplayName });
        }}
      />
    </Section>
  );
}

function useMemberInvitationSection(props: { team: Team }) {
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
    <Section
      title={t("Invite member")}
      description={t("Invite a user to your team through email")}
    >
      <form
        onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
        noValidate
      >
        <div className="flex flex-col gap-4 md:flex-row">
          <Input
            placeholder={t("Email")}
            {...register("email")}
          />
          <Button type="submit" loading={loading}>{t("Invite User")}</Button>
        </div>
        <FormWarningText text={errors.email?.message?.toString()} />
        {invitedEmail && <Typography type='label' variant='secondary'>Invited {invitedEmail}</Typography>}
      </form>
    </Section>
  );
}


function useMemberListSection(props: { team: Team }) {
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
      <Typography className='font-medium mb-2'>{t("Members")}</Typography>
      <div className='border rounded-md'>
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!project.config.clientTeamCreationEnabled) {
    return <MessageCard title={t("Team creation is not enabled")} />;
  }

  const onSubmit = async (data: yup.InferType<typeof teamCreationSchema>) => {
    setLoading(true);

    let team;
    try {
      team = await user.createTeam({ displayName: data.displayName });
    } finally {
      setLoading(false);
    }

    router.push(app.urls.accountSettings + `/teams/${team.id}`);
  };

  return (
    <PageLayout>
      <Section title={t("Create a Team")} description={t("Enter a display name for your new team")}>
        <form
          onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
          noValidate
          className='flex gap-2'
        >
          <div className='flex flex-col flex-1'>
            <Input
              id="displayName"
              type="text"
              {...register("displayName")}
            />
            <FormWarningText text={errors.displayName?.message?.toString()} />
          </div>
          <Button type="submit" loading={loading}>{t("Create")}</Button>
        </form>
      </Section>
    </PageLayout>
  );
}

export function useDeleteAccountSection() {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const app = useStackApp();
  const project = app.useProject();
  const [deleting, setDeleting] = useState(false);
  if (!project.config.clientUserDeletionEnabled) {
    return null;
  }

  return (
    <Section
      title={t("Delete Account")}
      description={t("Permanently remove your account and all associated data")}
    >
      <div className='stack-scope flex flex-col items-stretch'>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>{t("Danger zone")}</AccordionTrigger>
            <AccordionContent>
              {!deleting ? (
                <div>
                  <Button
                    variant='destructive'
                    onClick={() => setDeleting(true)}
                  >
                    {t("Delete account")}
                  </Button>
                </div>
              ) : (
                <div className='flex flex-col gap-2'>
                  <Typography variant='destructive'>
                    {t("Are you sure you want to delete your account? This action is IRREVERSIBLE and will delete ALL associated data.")}
                  </Typography>
                  <div className='flex gap-2'>
                    <Button
                      variant='destructive'
                      onClick={async () => {
                        await user.delete();
                        await app.redirectToHome();
                      }}
                    >
                      {t("Delete Account")}
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() => setDeleting(false)}
                    >
                      {t("Cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Section>
  );
}