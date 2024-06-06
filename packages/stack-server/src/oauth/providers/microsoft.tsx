import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";

export class MicrosoftProvider extends OAuthBaseProvider {
  constructor(options: {
    clientId: string,
    clientSecret: string,
    additionalScope: string,
  }) {
    super({
      issuer: "https://login.microsoftonline.com",
      authorizationEndpoint: "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
      tokenEndpoint: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
      redirectUri: process.env.NEXT_PUBLIC_STACK_URL + "/api/v1/auth/callback/microsoft",
      baseScope: "User.Read",
      ...options,
    });
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
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
