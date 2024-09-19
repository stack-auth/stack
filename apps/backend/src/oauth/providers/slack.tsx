import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class SlackProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new SlackProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://slack.com",
        authorizationEndpoint: "https://slack.com/oauth/v2/authorize",
        tokenEndpoint: "https://slack.com/api/oauth.v2.access",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/slack",
        baseScope: "",
        authorizationExtraParams: {
          user_scope: "email,profile,openid",
        },
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch(
      "https://slack.com/api/openid.connect.userInfo", {
        headers: {
          Authorization: `Bearer ${tokenSet.accessToken}`,
        }
      }
    ).then(res => res.json());
    return validateUserInfo({
      accountId: userInfo.sub?.toString(),
      displayName: userInfo.name,
      email: userInfo.email,
      profileImageUrl: userInfo.picture,
      emailVerified: userInfo.email_verified,
    });
  }
}