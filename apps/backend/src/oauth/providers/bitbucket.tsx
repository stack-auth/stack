import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class BitbucketProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new BitbucketProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://bitbucket.org",
        authorizationEndpoint: "https://bitbucket.org/site/oauth2/authorize",
        tokenEndpoint: "https://bitbucket.org/site/oauth2/access_token",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/bitbucket",
        baseScope: "account email",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch("https://api.bitbucket.org/2.0/user", {
      headers: {
        Authorization: `Bearer ${tokenSet.accessToken}`
      }
    }).then(
      (res) => res.json()
    );
    const emailData = await fetch("https://api.bitbucket.org/2.0/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenSet.accessToken}`
      }
    }).then((res) => res.json());

    return validateUserInfo({
      accountId: userInfo.uuid,
      displayName: userInfo.display_name,
      email: emailData?.values[0].email,
      profileImageUrl: userInfo.links.avatar.href,
    });
  }
}
