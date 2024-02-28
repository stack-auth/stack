import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./oauth-base";
import { OauthUserInfo, validateUserInfo } from "./utils";

export class FacebookProvider extends OAuthBaseProvider {
  constructor({
    clientId,
    clientSecret,
  }: {
    clientId: string,
    clientSecret: string,
  }) {
    super({
      issuer: "https://www.facebook.com",
      authorizationEndpoint: "https://facebook.com/dialog/oauth/",
      tokenEndpoint: "https://graph.facebook.com/oauth/access_token",
      clientId,
      clientSecret,
      redirectUri: process.env.NEXT_PUBLIC_STACK_URL + "/api/v1/auth/callback/facebook",
      jwksUri: "https://www.facebook.com/.well-known/oauth/openid/jwks/",
      scope: "openid public_profile email",
      openid: true,
    });
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OauthUserInfo> {
    const url = new URL('https://graph.facebook.com/v3.2/me');
    url.searchParams.append('access_token', tokenSet.access_token || "");
    url.searchParams.append('fields', 'id,name,email,picture');
    const rawUserInfo = await fetch(url).then((res) => res.json());
    return validateUserInfo({
      accountId: rawUserInfo.id,
      displayName: rawUserInfo.name,
      email: rawUserInfo.email,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
