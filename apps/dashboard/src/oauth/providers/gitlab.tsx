import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";

export class GitlabProvider extends OAuthBaseProvider {
  constructor(options: { clientId: string; clientSecret: string }) {
    super({
      issuer: "https://gitlab.com",
      authorizationEndpoint: "https://gitlab.com/oauth/authorize",
      tokenEndpoint: "https://gitlab.com/oauth/token",
      userinfoEndpoint: "https://gitlab.com/api/v4/user",
      redirectUri:
        process.env.NEXT_PUBLIC_STACK_URL_DEPRECATED +
        "/api/v1/auth/callback/gitlab",
      baseScope: "read_user",
      ...options,
    });
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet);

    return validateUserInfo({
      accountId: rawUserInfo.id?.toString(),
      displayName: rawUserInfo.name || rawUserInfo.username,
      email: rawUserInfo.email || rawUserInfo.commit_email || rawUserInfo.public_email,
      profileImageUrl: rawUserInfo.avatar_url,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
