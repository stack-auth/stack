import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";

export class GoogleProvider extends OAuthBaseProvider {
  constructor(options: {
    clientId: string,
    clientSecret: string,
    additionalScope: string,
  }) {
    super({
      issuer: "https://accounts.google.com",
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
      redirectUri: process.env.NEXT_PUBLIC_STACK_URL + "/api/v1/auth/callback/google",
      baseScope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
      ...options,
    });
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet);
    return validateUserInfo({
      accountId: rawUserInfo.sub,
      displayName: rawUserInfo.name,
      email: rawUserInfo.email,
      profileImageUrl: rawUserInfo.picture,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
