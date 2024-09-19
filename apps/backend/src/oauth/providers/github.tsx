import { OAuthBaseProvider, TokenSet } from "./base";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";

export class GithubProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: {
    clientId: string,
    clientSecret: string,
  }) {
    return new GithubProvider(...await OAuthBaseProvider.createConstructorArgs({
      issuer: "https://github.com",
      authorizationEndpoint: "https://github.com/login/oauth/authorize",
      tokenEndpoint: "https://github.com/login/oauth/access_token",
      userinfoEndpoint: "https://api.github.com/user",
      redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/github",
      baseScope: "user:email",
      ...options,
    }));
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet.accessToken);

    const emails = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${tokenSet.accessToken}`,
      },
    }).then((res) => res.json());
    if (!emails.find) {
      throw new StackAssertionError("Error fetching user emails from github", {
        emails,
        rawUserInfo,
      });
    }
    const { email, verified } = emails.find((e: any) => e.primary);

    return validateUserInfo({
      accountId: rawUserInfo.id?.toString(),
      displayName: rawUserInfo.name,
      email: rawUserInfo.email,
      profileImageUrl: rawUserInfo.avatar_url as any,
    });
  }
}
