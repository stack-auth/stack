import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";

export class GithubProvider extends OAuthBaseProvider {
  constructor(options: {
    clientId: string,
    clientSecret: string,
  }) {
    super({
      issuer: "https://github.com",
      authorizationEndpoint: "https://github.com/login/oauth/authorize",
      tokenEndpoint: "https://github.com/login/oauth/access_token",
      userinfoEndpoint: "https://api.github.com/user",
      redirectUri: process.env.NEXT_PUBLIC_STACK_URL_DEPRECATED + "/api/v1/auth/callback/github",
      baseScope: "user:email",
      ...options,
    });
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet);
    let email = rawUserInfo.email;
    if (!email) {
      const emails = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `token ${tokenSet.access_token}`,
        },
      }).then((res) => res.json());
      rawUserInfo.email = emails.find((e: any) => e.primary).email;
    }

    return validateUserInfo({
      accountId: rawUserInfo.id?.toString(),
      displayName: rawUserInfo.name,
      email: rawUserInfo.email,
      profileImageUrl: rawUserInfo.avatar_url,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
