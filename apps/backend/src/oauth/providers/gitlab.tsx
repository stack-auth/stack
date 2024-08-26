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
    const userInfo = await fetch("https://gitlab.com/api/v4/user", {
      headers: {
        Authorization: `Bearer ${tokenSet.accessToken}`
      }
    }).then(res=>res.json());
    return validateUserInfo({
      accountId: userInfo.id?.toString(),
      displayName: userInfo.name,
      email: userInfo.email,
      profileImageUrl: userInfo.avatar_url as any,
    });
  }
}
