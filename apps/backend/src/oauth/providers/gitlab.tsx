import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class GitlabProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new GitlabProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://gitlab.com",
        authorizationEndpoint: "https://gitlab.com/oauth/authorize",
        tokenEndpoint: "https://gitlab.com/oauth/token",
        userinfoEndpoint: "https://gitlab.com/api/v4/user",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/gitlab",
        baseScope: "read_user",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet.accessToken);
    return validateUserInfo({
      accountId: rawUserInfo.id?.toString(),
      displayName: rawUserInfo.name || rawUserInfo.username as any,
      email: rawUserInfo.email,
      profileImageUrl: rawUserInfo.avatar_url as any,
    });
  }
}
