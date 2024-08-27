import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class SalesforceProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new SalesforceProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://login.salesforce.com",
        authorizationEndpoint:
          "https://login.salesforce.com/services/oauth2/authorize",
        tokenEndpoint: "https://login.salesforce.com/services/oauth2/token",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/salesforce",
        baseScope: "oauth",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch(
      `https://login.salesforce.com/services/oauth2/userinfo?oauth_token=${tokenSet.accessToken}&format=json`
    ).then((res) => res.json());
    return validateUserInfo({
      accountId: userInfo.user_id,
      displayName: userInfo.name,
      email: userInfo.email,
      profileImageUrl: userInfo.picture,
    });
  }
}
