import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./oauth-base";
import { OauthUserInfo, validateUserInfo } from "./utils";

export class MicrosoftProvider extends OAuthBaseProvider {
  constructor({
    clientId,
    clientSecret,
    tenantId,
  }: {
    clientId: string,
    clientSecret: string,
    tenantId: string,
  }) {
    super({
      issuer: "https://login.microsoftonline.com/" + tenantId + "/v2.0",
      authorizationEndpoint: "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
      tokenEndpoint: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
      clientId,
      clientSecret,
      redirectUri: process.env.NEXT_PUBLIC_STACK_URL + "/api/v1/auth/callback/microsoft",
      scope: "openid User.Read",
      jwksUri: "https://login.microsoftonline.com/" + tenantId + "/discovery/v2.0/keys",
      openid: true,
    });
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OauthUserInfo> {
    const rawUserInfo = await fetch(
      'https://graph.microsoft.com/v1.0/me',
      {
        headers: {
          Authorization: `Bearer ${tokenSet.access_token}`,
        },
      }
    ).then(res => res.json());

    return validateUserInfo({
      accountId: rawUserInfo.id,
      displayName: rawUserInfo.displayName,
      email: rawUserInfo.mail || rawUserInfo.userPrincipalName,
      profileImageUrl: undefined, // Microsoft Graph API does not return profile image URL
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
