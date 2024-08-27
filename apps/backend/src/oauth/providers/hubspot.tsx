import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class HubspotProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new HubspotProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://hubspot.com",
        authorizationEndpoint: "https://app.hubspot.com/oauth/authorize",
        tokenEndpoint: "https://api.hubapi.com/oauth/v1/token",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/hubspot",
        baseScope: "oauth",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch(
      `https://api.hubapi.com/oauth/v1/access-tokens/${tokenSet.accessToken}`
    ).then(res => res.json());
    return validateUserInfo({
      accountId: userInfo.user_id?.toString(),
      displayName: userInfo.user,
      email: userInfo.user,
      // Hubspot does not provide profile image
      profileImageUrl: null,
    });
  }
}
