import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./oauth-base";
import { OauthUserInfo, validateUserInfo } from "./utils";

export class GoogleProvider extends OAuthBaseProvider {
  constructor({
    clientId,
    clientSecret,
  }: {
    clientId: string,
    clientSecret: string,
  }) {
    super({
      issuer: "https://accounts.google.com",
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
      clientId,
      clientSecret,
      redirectUri: process.env.NEXT_PUBLIC_STACK_URL + "/api/v1/auth/callback/google",
      jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
      scope: "openid email profile",
      openid: true,
    });
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OauthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet);
    return validateUserInfo({
      accountId: rawUserInfo.sub,
      displayName: rawUserInfo.name,
      email: rawUserInfo.email,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
