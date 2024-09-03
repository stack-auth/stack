import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { OAuthBaseProvider, TokenSet } from "./base";

export class GithubProvider extends OAuthBaseProvider {
  private constructor(...args: ConstructorParameters<typeof OAuthBaseProvider>) {
    super(...args);
  }

  static async create(options: { clientId: string; clientSecret: string }) {
    return new GithubProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://github.com",
        authorizationEndpoint: "https://github.com/login/oauth/authorize",
        tokenEndpoint: "https://github.com/login/oauth/access_token",
        userinfoEndpoint: "https://api.github.com/user",
        redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/github",
        baseScope: "user:email",
        // GitHub token does not expire except for lack of use in a year
        // We set a default of 1 year
        // https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation#token-expired-due-to-lack-of-use=
        defaultAccessTokenExpiresInMillis: 1000 * 60 * 60 * 24 * 365,
        ...options,
      })),
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet.accessToken);

    const emails = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${tokenSet.accessToken}`,
      },
    }).then((res) => res.json());
    const { email, verified } = emails.find((e: any) => e.primary);

    return validateUserInfo({
      accountId: rawUserInfo.id?.toString(),
      displayName: rawUserInfo.name,
      profileImageUrl: rawUserInfo.avatar_url as any,
      email: email,
      emailVerified: verified,
    });
  }
}
