import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class MockProvider extends OAuthBaseProvider {
  constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(providerId: string) {
    return new MockProvider(...await OAuthBaseProvider.createConstructorArgs({
      discoverFromUrl: getEnvVariable("STACK_OAUTH_MOCK_URL"),
      redirectUri: `${getEnvVariable("STACK_BASE_URL")}/api/v1/auth/oauth/callback/${providerId}`,
      baseScope: "openid",
      clientId: providerId,
      clientSecret: "MOCK-SERVER-SECRET",
    }));
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet);

    return validateUserInfo({
      accountId: rawUserInfo.sub,
      displayName: rawUserInfo.name,
      email: rawUserInfo.sub,
      profileImageUrl: rawUserInfo.picture,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
