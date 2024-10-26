'use client';

import { yupResolver } from "@hookform/resolvers/yup";
import { getPasswordError } from '@stackframe/stack-shared/dist/helpers/password';
import { useAsyncCallback } from '@stackframe/stack-shared/dist/hooks/use-async-callback';
import { yupObject, yupString } from '@stackframe/stack-shared/dist/schema-fields';
import { generateRandomValues } from '@stackframe/stack-shared/dist/utils/crypto';
import { throwErr } from '@stackframe/stack-shared/dist/utils/errors';
import { runAsynchronously, runAsynchronouslyWithAlert } from '@stackframe/stack-shared/dist/utils/promises';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, ActionCell, Badge, Button, Input, Label, PasswordInput, Separator, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Typography } from '@stackframe/stack-ui';
import { CirclePlus, Contact, Edit, LucideIcon, Settings, ShieldCheck } from 'lucide-react';
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
    id: string,
  }[],
}) {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const teams = user.useTeams();
  const stackApp = useStackApp();
  const project = stackApp.useProject();

  return (
    <MaybeFullPage fullPage={!!props.fullPage}>
      <div className="self-stretch flex-grow w-full">
        <SidebarLayout
          items={([
            {
              title: t('My Profile'),
              type: 'item',
              id: 'profile',
              icon: Contact,
              content: <ProfilePage/>,
            },
            {
              title: t('Emails & Auth'),
              type: 'item',
              id: 'auth',
              icon: ShieldCheck,
              content: <EmailsAndAuthPage/>,
            },
            {
              title: t('Settings'),
              type: 'item',
              id: 'settings',
              icon: Settings,
              content: <SettingsPage/>,
            },
            ...(props.extraItems?.map(item => ({
              title: item.title,
              type: 'item',
              id: item.id,
              icon: item.icon,
              content: item.content,
            } as const)) || []),
            ...(teams.length > 0 || project.config.clientTeamCreationEnabled) ? [{
              title: t('Teams'),
              type: 'divider',
            }] as const : [],
            ...teams.map(team => ({
              title: <div className='flex gap-2 items-center w-full'>
                <TeamIcon team={team}/>
                <Typography className="max-w-[320px] md:w-[90%] truncate">{team.displayName}</Typography>
              </div>,
              type: 'item',
              id: `team-${team.id}`,
              content: <TeamPage team={team}/>,
            } as const)),
            ...project.config.clientTeamCreationEnabled ? [{
              title: t('Create a team'),
              icon: CirclePlus,
              type: 'item',
              id: 'team-creation',
              content: <TeamCreation />,
            }] as const : [],
          ] as const).filter((p) => p.type === 'divider' || (p as any).content )}
          title={t("Account Settings")}
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
      <div className='sm:flex-1 sm:items-end flex flex-col gap-2 '>
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

function EmailsSection() {
  const { t } = useTranslation();
  const user = useUser({ or: 'redirect' });
  const contactChannels = user.useContactChannels();
  const [addingEmail, setAddingEmail] = useState(contactChannels.length === 0);
  const [addingEmailLoading, setAddingEmailLoading] = useState(false);
  const [addedEmail, setAddedEmail] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const isLastEmail = contactChannels.filter(x => x.usedForAuth && x.type === 'email').length === 1;

  useEffect(() => {
    if (addedEmail) {
      runAsynchronously(async () => {
        const cc = contactChannels.find(x => x.value === addedEmail);
        if (cc && !cc.isVerified) {
          await cc.sendVerificationEmail();
        }
        setAddedEmail(null);
      });
    }
  }, [contactChannels, addedEmail]);

  const emailSchema = yupObject({
    email: yupString()
      .email(t('Please enter a valid email address'))
      .notOneOf(contactChannels.map(x => x.value), t('Email already exists'))
      .required(t('Email is required')),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(emailSchema)
  });

  const onSubmit = async (data: yup.InferType<typeof emailSchema>) => {
    setAddingEmailLoading(true);
    try {
      await user.createContactChannel({ type: 'email', value: data.email, usedForAuth: false });
      setAddedEmail(data.email);
    } finally {
      setAddingEmailLoading(false);
    }
    setAddingEmail(false);
    reset();
  };

  return (
    <div>
      <div className='flex flex-col md:flex-row justify-between mb-4 gap-4'>
        <Typography className='font-medium'>{t("Emails")}</Typography>
        {addingEmail ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAsynchronously(handleSubmit(onSubmit));
            }}
            className='flex flex-col'
          >
            <div className='flex gap-2'>
              <Input
                {...register("email")}
                placeholder={t("Enter email")}
              />
              <Button type="submit" loading={addingEmailLoading}>
                {t("Add")}
              </Button>
              <Button
                variant='secondary'
                onClick={() => {
                  setAddingEmail(false);
                  reset();
                }}
              >
                {t("Cancel")}
              </Button>
            </div>
            {errors.email && <FormWarningText text={errors.email.message} />}
          </form>
        ) : (
          <div className='flex md:justify-end'>
            <Button variant='secondary' onClick={() => setAddingEmail(true)}>{t("Add an email")}</Button>
          </div>
        )}
      </div>

      {contactChannels.length > 0 ? (
        <div className='border rounded-md'>
          <Table>
            <TableBody>
              {/*eslint-disable-next-line @typescript-eslint/no-unnecessary-condition*/}
              {contactChannels.filter(x => x.type === 'email')
                .sort((a, b) => {
                  if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
                  if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
                  return 0;
                })
                .map(x => (
                  <TableRow key={x.id}>
                    <TableCell>
                      <div className='flex flex-col md:flex-row gap-2 md:gap-4'>
                        {x.value}
                        <div className='flex gap-2'>
                          {x.isPrimary ? <Badge>{t("Primary")}</Badge> : null}
                          {!x.isVerified ? <Badge variant='destructive'>{t("Unverified")}</Badge> : null}
                          {x.usedForAuth ? <Badge variant='outline'>{t("Used for sign-in")}</Badge> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="flex justify-end">
                      <ActionCell items={[
                        ...(!x.isVerified ? [{
                          item: t("Send verification email"),
                          onClick: async () => { await x.sendVerificationEmail(); },
                        }] : []),
                        ...(!x.isPrimary && x.isVerified ? [{
                          item: t("Set as primary"),
                          onClick: async () => { await x.update({ isPrimary: true }); },
                        }] :
                          !x.isPrimary ? [{
                            item: t("Set as primary"),
                            onClick: async () => {},
                            disabled: true,
                            disabledTooltip: t("Please verify your email first"),
                          }] : []),
                        ...(!x.usedForAuth && x.isVerified ? [{
                          item: t("Use for sign-in"),
                          onClick: async () => { await x.update({ usedForAuth: true }); },
                        }] : []),
                        ...(x.usedForAuth && !isLastEmail ? [{
                          item: t("Stop using for sign-in"),
                          onClick: async () => { await x.update({ usedForAuth: false }); },
                        }] : x.usedForAuth ? [{
                          item: t("Stop using for sign-in"),
                          onClick: async () => {},
                          disabled: true,
                          disabledTooltip: t("You can not remove your last sign-in email"),
                        }] : []),
                        ...(!isLastEmail || !x.usedForAuth ? [{
                          item: t("Remove"),
                          onClick: async () => { await x.delete(); },
                          danger: true,
                        }] : [{
                          item: t("Remove"),
                          onClick: async () => {},
                          disabled: true,
                          disabledTooltip: t("You can not remove your last sign-in email"),
                        }]),
                      ]}/>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}

function EmailsAndAuthPage() {
  const passwordSection = usePasswordSection();
  const mfaSection = useMfaSection();
  const otpSection = useOtpSection();

  return (
    <PageLayout>
      <EmailsSection/>
      {passwordSection}
      {otpSection}
      {mfaSection}
    </PageLayout>
  );
}

function useOtpSection() {
  const { t } = useTranslation();
  const user = useUser({ or: "throw" });
  const project = useStackApp().useProject();
  const contactChannels = user.useContactChannels();
  const isLastAuth = user.otpAuthEnabled && !user.hasPassword && user.oauthProviders.length === 0;
  const [disabling, setDisabling] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const hasValidEmail = contactChannels.filter(x => x.type === 'email' && x.isVerified && x.usedForAuth).length > 0;

  if (!project.config.magicLinkEnabled) {
    return null;
  }

  const handleDisableOTP = async () => {
    await user.update({ otpAuthEnabled: false });
    setDisabling(false);
  };

  return (
    <Section title={t("OTP sign-in")} description={user.otpAuthEnabled ? t("OTP/magic link sign-in is currently enabled.") : t("Enable sign-in via magic link or OTP sent to your sign-in emails.")}>
      <div className='flex md:justify-end'>
        {hasValidEmail ? (
          user.otpAuthEnabled ? (
            !isLastAuth ? (
              !disabling ? (
                <Button
                  variant='secondary'
                  onClick={() => setDisabling(true)}
                >
                  {t("Disable OTP")}
                </Button>
              ) : (
                <div className='flex flex-col gap-2'>
                  <Typography variant='destructive'>
                    {t("Are you sure you want to disable OTP sign-in? You will not be able to sign in with only emails anymore.")}
                  </Typography>
                  <div className='flex gap-2'>
                    <Button
                      variant='destructive'
                      onClick={handleDisableOTP}
                    >
                      {t("Disable")}
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() => setDisabling(false)}
                    >
                      {t("Cancel")}
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <Typography variant='secondary' type='label'>{t("OTP sign-in is enabled and cannot be disabled as it is currently the only sign-in method")}</Typography>
            )
          ) : (
            <Button
              variant='secondary'
              onClick={async () => {
                await user.update({ otpAuthEnabled: true });
              }}
            >
              {t("Enable OTP")}
            </Button>
          )
        ) : (
          <Typography variant='secondary' type='label'>{t("To enable OTP sign-in, please add a verified email and set it as your sign-in email.")}</Typography>
        )}
      </div>
    </Section>
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

function usePasswordSection() {
  const { t } = useTranslation();
  const user = useUser({ or: "throw" });
  const contactChannels = user.useContactChannels();
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordSchema = yupObject({
    oldPassword: user.hasPassword ? yupString().required(t('Please enter your old password')) : yupString(),
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

  const { register, handleSubmit, setError, formState: { errors }, clearErrors, reset } = useForm({
    resolver: yupResolver(passwordSchema)
  });

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const hasValidEmail = contactChannels.filter(x => x.type === 'email' && x.isVerified && x.usedForAuth).length > 0;

  const onSubmit = async (data: yup.InferType<typeof passwordSchema>) => {
    setLoading(true);
    try {
      const { oldPassword, newPassword } = data;
      const error = user.hasPassword
        ? await user.updatePassword({ oldPassword: oldPassword!, newPassword })
        : await user.setPassword({ password: newPassword! });
      if (error) {
        setError('oldPassword', { type: 'manual', message: t('Incorrect password') });
      } else {
        reset();
        setChangingPassword(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const registerPassword = register('newPassword');
  const registerPasswordRepeat = register('newPasswordRepeat');

  return (
    <Section
      title={t("Password")}
      description={user.hasPassword ? t("Update your password") : t("Set a password for your account")}
    >
      <div className='flex flex-col gap-4'>
        {!changingPassword ? (
          hasValidEmail ? (
            <Button
              variant='secondary'
              onClick={() => setChangingPassword(true)}
            >
              {user.hasPassword ? t("Update password") : t("Set password")}
            </Button>
          ) : (
            <Typography variant='secondary' type='label'>{t("To set a password, please add a verified email and set it as your sign-in email.")}</Typography>
          )
        ) : (
          <form
            onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
            noValidate
          >
            {user.hasPassword && (
              <>
                <Label htmlFor="old-password" className="mb-1">{t("Old password")}</Label>
                <Input
                  id="old-password"
                  type="password"
                  {...register("oldPassword")}
                />
                <FormWarningText text={errors.oldPassword?.message?.toString()} />
              </>
            )}

            <Label htmlFor="new-password" className="mt-4 mb-1">{t("New password")}</Label>
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

            <Label htmlFor="repeat-password" className="mt-4 mb-1">{t("Repeat new password")}</Label>
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

            <div className="mt-6 flex gap-4">
              <Button type="submit" loading={loading}>
                {user.hasPassword ? t("Update Password") : t("Set Password")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setChangingPassword(false);
                  reset();
                }}
              >
                {t("Cancel")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Section>
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
      title={t("Multi-factor authentication")}
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
              {t("Disable MFA")}
            </Button>
          ) : !generatedSecret && (
            <Button
              variant='secondary'
              onClick={async () => {
                const secret = generateRandomValues(new Uint8Array(20));
                setQrCodeUrl(await generateTotpQrCode(project, user, secret));
                setGeneratedSecret(secret);
              }}
            >
              {t("Enable MFA")}
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
        className='w-full'
      >
        <div className="flex flex-col gap-4 sm:flex-row w-full">
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

    router.push(`#team-${team.id}`);
  };

  return (
    <PageLayout>
      <Section title={t("Create a Team")} description={t("Enter a display name for your new team")}>
        <form
          onSubmit={e => runAsynchronouslyWithAlert(handleSubmit(onSubmit)(e))}
          noValidate
          className='flex gap-2 flex-col sm:flex-row'
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

export function EditableText(props: { value: string, onSave?: (value: string) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(props.value);
  const { t } = useTranslation();

  return (
    <div className='flex items-center gap-2'>
      {editing ? (
        <>
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
          />
          <Button
            size='sm'
            onClick={async () => {
              await props.onSave?.(editingValue);
              setEditing(false);
            }}
          >
            {t("Save")}
          </Button>
          <Button
            size='sm'
            variant='secondary'
            onClick={() => {
              setEditingValue(props.value);
              setEditing(false);
            }}>
            {t("Cancel")}
          </Button>
        </>
      ) : (
        <>
          <Typography>{props.value}</Typography>
          <Button onClick={() => setEditing(true)} size='icon' variant='ghost'>
            <Edit className="w-4 h-4"/>
          </Button>
        </>
      )}
    </div>
  );
}
