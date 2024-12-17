import { GET as iGet } from '../../api/v1/route';
import { GET as iUsersGet } from '../../api/v1/users/route';
import { POST as iUsersPost } from '../../api/v1/users/route';
import { GET as iTeamsGet } from '../../api/v1/teams/route';
import { POST as iTeamsPost } from '../../api/v1/teams/route';
import { GET as iTeamPermissionsGet } from '../../api/v1/team-permissions/route';
import { GET as iTeamPermissionDefinitionsGet } from '../../api/v1/team-permission-definitions/route';
import { POST as iTeamPermissionDefinitionsPost } from '../../api/v1/team-permission-definitions/route';
import { GET as iTeamInvitationsGet } from '../../api/v1/team-invitations/route';
import { GET as iTeamMemberProfilesGet } from '../../api/v1/team-member-profiles/route';
import { GET as iEmailTemplatesGet } from '../../api/v1/email-templates/route';
import { GET as iContactChannelsGet } from '../../api/v1/contact-channels/route';
import { POST as iContactChannelsPost } from '../../api/v1/contact-channels/route';
import { POST as iCheckVersionPost } from '../../api/v1/check-version/route';
import { POST as iCheckFeatureSupportPost } from '../../api/v1/check-feature-support/route';
import { POST as iWebhooksSvixTokenPost } from '../../api/v1/webhooks/svix-token/route';
import { GET as iUsersMeGet } from '../../api/v1/users/me/route';
import { DELETE as iUsersMeDelete } from '../../api/v1/users/me/route';
import { PATCH as iUsersMePatch } from '../../api/v1/users/me/route';
import { GET as iUsersUserIdGet } from '../../api/v1/users/[user_id]/route';
import { DELETE as iUsersUserIdDelete } from '../../api/v1/users/[user_id]/route';
import { PATCH as iUsersUserIdPatch } from '../../api/v1/users/[user_id]/route';
import { GET as iTeamsTeamIdGet } from '../../api/v1/teams/[team_id]/route';
import { DELETE as iTeamsTeamIdDelete } from '../../api/v1/teams/[team_id]/route';
import { PATCH as iTeamsTeamIdPatch } from '../../api/v1/teams/[team_id]/route';
import { DELETE as iTeamPermissionDefinitionsPermissionIdDelete } from '../../api/v1/team-permission-definitions/[permission_id]/route';
import { PATCH as iTeamPermissionDefinitionsPermissionIdPatch } from '../../api/v1/team-permission-definitions/[permission_id]/route';
import { POST as iTeamInvitationsSendCodePost } from '../../api/v1/team-invitations/send-code/route';
import { DELETE as iTeamInvitationsIdDelete } from '../../api/v1/team-invitations/[id]/route';
import { POST as iTeamInvitationsAcceptPost } from '../../api/v1/team-invitations/accept/route';
import { GET as iProjectsCurrentGet } from '../../api/v1/projects/current/route';
import { DELETE as iProjectsCurrentDelete } from '../../api/v1/projects/current/route';
import { PATCH as iProjectsCurrentPatch } from '../../api/v1/projects/current/route';
import { GET as iInternalProjectsGet } from '../../api/v1/internal/projects/route';
import { POST as iInternalProjectsPost } from '../../api/v1/internal/projects/route';
import { GET as iInternalApiKeysGet } from '../../api/v1/internal/api-keys/route';
import { POST as iInternalApiKeysPost } from '../../api/v1/internal/api-keys/route';
import { POST as iContactChannelsVerifyPost } from '../../api/v1/contact-channels/verify/route';
import { POST as iContactChannelsSendVerificationCodePost } from '../../api/v1/contact-channels/send-verification-code/route';
import { POST as iAuthSessionsPost } from '../../api/v1/auth/sessions/route';
import { POST as iTeamMembershipsTeamIdUserIdPost } from '../../api/v1/team-memberships/[team_id]/[user_id]/route';
import { DELETE as iTeamMembershipsTeamIdUserIdDelete } from '../../api/v1/team-memberships/[team_id]/[user_id]/route';
import { POST as iTeamInvitationsAcceptDetailsPost } from '../../api/v1/team-invitations/accept/details/route';
import { POST as iTeamInvitationsAcceptCheckCodePost } from '../../api/v1/team-invitations/accept/check-code/route';
import { GET as iTeamMemberProfilesTeamIdUserIdGet } from '../../api/v1/team-member-profiles/[team_id]/[user_id]/route';
import { PATCH as iTeamMemberProfilesTeamIdUserIdPatch } from '../../api/v1/team-member-profiles/[team_id]/[user_id]/route';
import { POST as iIntegrationsNeonWebhooksPost } from '../../api/v1/integrations/neon/webhooks/route';
import { GET as iIntegrationsNeonOauthProvidersGet } from '../../api/v1/integrations/neon/oauth-providers/route';
import { POST as iIntegrationsNeonOauthProvidersPost } from '../../api/v1/integrations/neon/oauth-providers/route';
import { GET as iIntegrationsNeonOauthGet } from '../../api/v1/integrations/neon/oauth/route';
import { GET as iInternalApiKeysApiKeyIdGet } from '../../api/v1/internal/api-keys/[api_key_id]/route';
import { PATCH as iInternalApiKeysApiKeyIdPatch } from '../../api/v1/internal/api-keys/[api_key_id]/route';
import { GET as iIntegrationsNeonApiKeysGet } from '../../api/v1/integrations/neon/api-keys/route';
import { POST as iIntegrationsNeonApiKeysPost } from '../../api/v1/integrations/neon/api-keys/route';
import { GET as iContactChannelsUserIdContactChannelIdGet } from '../../api/v1/contact-channels/[user_id]/[contact_channel_id]/route';
import { DELETE as iContactChannelsUserIdContactChannelIdDelete } from '../../api/v1/contact-channels/[user_id]/[contact_channel_id]/route';
import { PATCH as iContactChannelsUserIdContactChannelIdPatch } from '../../api/v1/contact-channels/[user_id]/[contact_channel_id]/route';
import { POST as iContactChannelsVerifyCheckCodePost } from '../../api/v1/contact-channels/verify/check-code/route';
import { DELETE as iAuthSessionsCurrentDelete } from '../../api/v1/auth/sessions/current/route';
import { GET as iEmailTemplatesTypeGet } from '../../api/v1/email-templates/[type]/route';
import { DELETE as iEmailTemplatesTypeDelete } from '../../api/v1/email-templates/[type]/route';
import { PATCH as iEmailTemplatesTypePatch } from '../../api/v1/email-templates/[type]/route';
import { POST as iAuthPasswordUpdatePost } from '../../api/v1/auth/password/update/route';
import { POST as iAuthPasswordSignUpPost } from '../../api/v1/auth/password/sign-up/route';
import { POST as iAuthPasswordSignInPost } from '../../api/v1/auth/password/sign-in/route';
import { POST as iAuthPasswordSendResetCodePost } from '../../api/v1/auth/password/send-reset-code/route';
import { POST as iAuthPasswordResetPost } from '../../api/v1/auth/password/reset/route';
import { POST as iAuthPasswordSetPost } from '../../api/v1/auth/password/set/route';
import { POST as iAuthPasskeySignInPost } from '../../api/v1/auth/passkey/sign-in/route';
import { POST as iAuthPasskeyRegisterPost } from '../../api/v1/auth/passkey/register/route';
import { POST as iAuthPasskeyInitiatePasskeyAuthenticationPost } from '../../api/v1/auth/passkey/initiate-passkey-authentication/route';
import { POST as iAuthOtpSignInPost } from '../../api/v1/auth/otp/sign-in/route';
import { POST as iAuthOtpSendSignInCodePost } from '../../api/v1/auth/otp/send-sign-in-code/route';
import { POST as iAuthPasskeyInitiatePasskeyRegistrationPost } from '../../api/v1/auth/passkey/initiate-passkey-registration/route';
import { POST as iAuthOauthTokenPost } from '../../api/v1/auth/oauth/token/route';
import { POST as iAuthMfaSignInPost } from '../../api/v1/auth/mfa/sign-in/route';
import { POST as iTeamPermissionsTeamIdUserIdPermissionIdPost } from '../../api/v1/team-permissions/[team_id]/[user_id]/[permission_id]/route';
import { DELETE as iTeamPermissionsTeamIdUserIdPermissionIdDelete } from '../../api/v1/team-permissions/[team_id]/[user_id]/[permission_id]/route';
import { POST as iIntegrationsNeonProjectsProvisionPost } from '../../api/v1/integrations/neon/projects/provision/route';
import { DELETE as iIntegrationsNeonOauthProvidersOauthProviderIdDelete } from '../../api/v1/integrations/neon/oauth-providers/[oauth_provider_id]/route';
import { PATCH as iIntegrationsNeonOauthProvidersOauthProviderIdPatch } from '../../api/v1/integrations/neon/oauth-providers/[oauth_provider_id]/route';
import { POST as iIntegrationsNeonInternalConfirmPost } from '../../api/v1/integrations/neon/internal/confirm/route';
import { POST as iIntegrationsNeonOauthTokenPost } from '../../api/v1/integrations/neon/oauth/token/route';
import { GET as iIntegrationsNeonApiKeysApiKeyIdGet } from '../../api/v1/integrations/neon/api-keys/[api_key_id]/route';
import { PATCH as iIntegrationsNeonApiKeysApiKeyIdPatch } from '../../api/v1/integrations/neon/api-keys/[api_key_id]/route';
import { POST as iContactChannelsUserIdContactChannelIdSendVerificationCodePost } from '../../api/v1/contact-channels/[user_id]/[contact_channel_id]/send-verification-code/route';
import { GET as iIntegrationsNeonOauthAuthorizeGet } from '../../api/v1/integrations/neon/oauth/authorize/route';
import { POST as iAuthSessionsCurrentRefreshPost } from '../../api/v1/auth/sessions/current/refresh/route';
import { POST as iConnectedAccountsUserIdProviderIdAccessTokenPost } from '../../api/v1/connected-accounts/[user_id]/[provider_id]/access-token/route';
import { POST as iAuthOtpSignInCheckCodePost } from '../../api/v1/auth/otp/sign-in/check-code/route';
import { POST as iAuthPasswordResetCheckCodePost } from '../../api/v1/auth/password/reset/check-code/route';
import { POST as iIntegrationsNeonProjectsTransferInitiatePost } from '../../api/v1/integrations/neon/projects/transfer/initiate/route';
import { GET as iAuthOauthAuthorizeProviderIdGet } from '../../api/v1/auth/oauth/authorize/[provider_id]/route';
import { GET as iAuthOauthCallbackProviderIdGet } from '../../api/v1/auth/oauth/callback/[provider_id]/route';
import { POST as iAuthOauthCallbackProviderIdPost } from '../../api/v1/auth/oauth/callback/[provider_id]/route';
import { POST as iIntegrationsNeonProjectsTransferConfirmPost } from '../../api/v1/integrations/neon/projects/transfer/confirm/route';
import { GET as iIntegrationsNeonOauthIdpRouteGet } from '../../api/v1/integrations/neon/oauth/idp/[[...route]]/route';
import { POST as iIntegrationsNeonOauthIdpRoutePost } from '../../api/v1/integrations/neon/oauth/idp/[[...route]]/route';
import { PUT as iIntegrationsNeonOauthIdpRoutePut } from '../../api/v1/integrations/neon/oauth/idp/[[...route]]/route';
import { DELETE as iIntegrationsNeonOauthIdpRouteDelete } from '../../api/v1/integrations/neon/oauth/idp/[[...route]]/route';
import { PATCH as iIntegrationsNeonOauthIdpRoutePatch } from '../../api/v1/integrations/neon/oauth/idp/[[...route]]/route';
import { OPTIONS as iIntegrationsNeonOauthIdpRouteOptions } from '../../api/v1/integrations/neon/oauth/idp/[[...route]]/route';
import { HEAD as iIntegrationsNeonOauthIdpRouteHead } from '../../api/v1/integrations/neon/oauth/idp/[[...route]]/route';
import { POST as iAuthOauthConnectedAccountsProviderIdAccessTokenPost } from '../../api/v1/auth/oauth/connected-accounts/[provider_id]/access-token/route';

export const endpoints = {
  '/': { GET: iGet },
  '/users': { GET: iUsersGet, POST: iUsersPost },
  '/teams': { GET: iTeamsGet, POST: iTeamsPost },
  '/team-permissions': { GET: iTeamPermissionsGet },
  '/team-permission-definitions': {
    GET: iTeamPermissionDefinitionsGet,
    POST: iTeamPermissionDefinitionsPost,
  },
  '/team-invitations': { GET: iTeamInvitationsGet },
  '/team-member-profiles': { GET: iTeamMemberProfilesGet },
  '/email-templates': { GET: iEmailTemplatesGet },
  '/contact-channels': { GET: iContactChannelsGet, POST: iContactChannelsPost },
  '/check-version': { POST: iCheckVersionPost },
  '/check-feature-support': { POST: iCheckFeatureSupportPost },
  '/webhooks/svix-token': { POST: iWebhooksSvixTokenPost },
  '/users/me': {
    GET: iUsersMeGet,
    DELETE: iUsersMeDelete,
    PATCH: iUsersMePatch,
  },
  '/users/[user_id]': {
    GET: iUsersUserIdGet,
    DELETE: iUsersUserIdDelete,
    PATCH: iUsersUserIdPatch,
  },
  '/teams/[team_id]': {
    GET: iTeamsTeamIdGet,
    DELETE: iTeamsTeamIdDelete,
    PATCH: iTeamsTeamIdPatch,
  },
  '/team-permission-definitions/[permission_id]': {
    DELETE: iTeamPermissionDefinitionsPermissionIdDelete,
    PATCH: iTeamPermissionDefinitionsPermissionIdPatch,
  },
  '/team-invitations/send-code': { POST: iTeamInvitationsSendCodePost },
  '/team-invitations/[id]': { DELETE: iTeamInvitationsIdDelete },
  '/team-invitations/accept': { POST: iTeamInvitationsAcceptPost },
  '/projects/current': {
    GET: iProjectsCurrentGet,
    DELETE: iProjectsCurrentDelete,
    PATCH: iProjectsCurrentPatch,
  },
  '/internal/projects': {
    GET: iInternalProjectsGet,
    POST: iInternalProjectsPost,
  },
  '/internal/api-keys': {
    GET: iInternalApiKeysGet,
    POST: iInternalApiKeysPost,
  },
  '/contact-channels/verify': { POST: iContactChannelsVerifyPost },
  '/contact-channels/send-verification-code': {
    POST: iContactChannelsSendVerificationCodePost,
  },
  '/auth/sessions': { POST: iAuthSessionsPost },
  '/team-memberships/[team_id]/[user_id]': {
    POST: iTeamMembershipsTeamIdUserIdPost,
    DELETE: iTeamMembershipsTeamIdUserIdDelete,
  },
  '/team-invitations/accept/details': {
    POST: iTeamInvitationsAcceptDetailsPost,
  },
  '/team-invitations/accept/check-code': {
    POST: iTeamInvitationsAcceptCheckCodePost,
  },
  '/team-member-profiles/[team_id]/[user_id]': {
    GET: iTeamMemberProfilesTeamIdUserIdGet,
    PATCH: iTeamMemberProfilesTeamIdUserIdPatch,
  },
  '/integrations/neon/webhooks': { POST: iIntegrationsNeonWebhooksPost },
  '/integrations/neon/oauth-providers': {
    GET: iIntegrationsNeonOauthProvidersGet,
    POST: iIntegrationsNeonOauthProvidersPost,
  },
  '/integrations/neon/oauth': { GET: iIntegrationsNeonOauthGet },
  '/internal/api-keys/[api_key_id]': {
    GET: iInternalApiKeysApiKeyIdGet,
    PATCH: iInternalApiKeysApiKeyIdPatch,
  },
  '/integrations/neon/api-keys': {
    GET: iIntegrationsNeonApiKeysGet,
    POST: iIntegrationsNeonApiKeysPost,
  },
  '/contact-channels/[user_id]/[contact_channel_id]': {
    GET: iContactChannelsUserIdContactChannelIdGet,
    DELETE: iContactChannelsUserIdContactChannelIdDelete,
    PATCH: iContactChannelsUserIdContactChannelIdPatch,
  },
  '/contact-channels/verify/check-code': {
    POST: iContactChannelsVerifyCheckCodePost,
  },
  '/auth/sessions/current': { DELETE: iAuthSessionsCurrentDelete },
  '/email-templates/[type]': {
    GET: iEmailTemplatesTypeGet,
    DELETE: iEmailTemplatesTypeDelete,
    PATCH: iEmailTemplatesTypePatch,
  },
  '/auth/password/update': { POST: iAuthPasswordUpdatePost },
  '/auth/password/sign-up': { POST: iAuthPasswordSignUpPost },
  '/auth/password/sign-in': { POST: iAuthPasswordSignInPost },
  '/auth/password/send-reset-code': { POST: iAuthPasswordSendResetCodePost },
  '/auth/password/reset': { POST: iAuthPasswordResetPost },
  '/auth/password/set': { POST: iAuthPasswordSetPost },
  '/auth/passkey/sign-in': { POST: iAuthPasskeySignInPost },
  '/auth/passkey/register': { POST: iAuthPasskeyRegisterPost },
  '/auth/passkey/initiate-passkey-authentication': {
    POST: iAuthPasskeyInitiatePasskeyAuthenticationPost,
  },
  '/auth/otp/sign-in': { POST: iAuthOtpSignInPost },
  '/auth/otp/send-sign-in-code': { POST: iAuthOtpSendSignInCodePost },
  '/auth/passkey/initiate-passkey-registration': {
    POST: iAuthPasskeyInitiatePasskeyRegistrationPost,
  },
  '/auth/oauth/token': { POST: iAuthOauthTokenPost },
  '/auth/mfa/sign-in': { POST: iAuthMfaSignInPost },
  '/team-permissions/[team_id]/[user_id]/[permission_id]': {
    POST: iTeamPermissionsTeamIdUserIdPermissionIdPost,
    DELETE: iTeamPermissionsTeamIdUserIdPermissionIdDelete,
  },
  '/integrations/neon/projects/provision': {
    POST: iIntegrationsNeonProjectsProvisionPost,
  },
  '/integrations/neon/oauth-providers/[oauth_provider_id]': {
    DELETE: iIntegrationsNeonOauthProvidersOauthProviderIdDelete,
    PATCH: iIntegrationsNeonOauthProvidersOauthProviderIdPatch,
  },
  '/integrations/neon/internal/confirm': {
    POST: iIntegrationsNeonInternalConfirmPost,
  },
  '/integrations/neon/oauth/token': { POST: iIntegrationsNeonOauthTokenPost },
  '/integrations/neon/api-keys/[api_key_id]': {
    GET: iIntegrationsNeonApiKeysApiKeyIdGet,
    PATCH: iIntegrationsNeonApiKeysApiKeyIdPatch,
  },
  '/contact-channels/[user_id]/[contact_channel_id]/send-verification-code': {
    POST: iContactChannelsUserIdContactChannelIdSendVerificationCodePost,
  },
  '/integrations/neon/oauth/authorize': {
    GET: iIntegrationsNeonOauthAuthorizeGet,
  },
  '/auth/sessions/current/refresh': { POST: iAuthSessionsCurrentRefreshPost },
  '/connected-accounts/[user_id]/[provider_id]/access-token': {
    POST: iConnectedAccountsUserIdProviderIdAccessTokenPost,
  },
  '/auth/otp/sign-in/check-code': { POST: iAuthOtpSignInCheckCodePost },
  '/auth/password/reset/check-code': { POST: iAuthPasswordResetCheckCodePost },
  '/integrations/neon/projects/transfer/initiate': {
    POST: iIntegrationsNeonProjectsTransferInitiatePost,
  },
  '/auth/oauth/authorize/[provider_id]': {
    GET: iAuthOauthAuthorizeProviderIdGet,
  },
  '/auth/oauth/callback/[provider_id]': {
    GET: iAuthOauthCallbackProviderIdGet,
    POST: iAuthOauthCallbackProviderIdPost,
  },
  '/integrations/neon/projects/transfer/confirm': {
    POST: iIntegrationsNeonProjectsTransferConfirmPost,
  },
  '/integrations/neon/oauth/idp/[[...route]]': {
    GET: iIntegrationsNeonOauthIdpRouteGet,
    POST: iIntegrationsNeonOauthIdpRoutePost,
    PUT: iIntegrationsNeonOauthIdpRoutePut,
    DELETE: iIntegrationsNeonOauthIdpRouteDelete,
    PATCH: iIntegrationsNeonOauthIdpRoutePatch,
    OPTIONS: iIntegrationsNeonOauthIdpRouteOptions,
    HEAD: iIntegrationsNeonOauthIdpRouteHead,
  },
  '/auth/oauth/connected-accounts/[provider_id]/access-token': {
    POST: iAuthOauthConnectedAccountsProviderIdAccessTokenPost,
  },
};
