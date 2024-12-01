import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { OAuthBaseProvider, TokenSet } from "./base";

export class MockProvider extends OAuthBaseProvider {
  constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(providerId: string) {
    return new MockProvider(...await OAuthBaseProvider.createConstructorArgs({
      discoverFromUrl: getEnvVariable("STACK_OAUTH_MOCK_URL"),
      redirectUri: `${getEnvVariable("NEXT_PUBLIC_STACK_API_URL")}/api/v1/auth/oauth/callback/${providerId}`,
      baseScope: "openid",
      openid: true,
      clientId: providerId,
      clientSecret: "MOCK-SERVER-SECRET",
    }));
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet.accessToken);

    return validateUserInfo({
      accountId: rawUserInfo.sub,
      displayName: rawUserInfo.name,
      email: rawUserInfo.sub,
      profileImageUrl: rawUserInfo.picture,
    });
  }
}
