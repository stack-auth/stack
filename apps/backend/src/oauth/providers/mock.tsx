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

  static async create(providerId: string, options: {
    clientId: string,
    clientSecret: string,
  }) {
    if (options.clientId !== "MOCK") {
      throw new Error("Invalid client ID; must be MOCK for the mock provider");
    }
    if (options.clientSecret !== "MOCK") {
      throw new Error("Invalid client secret; must be MOCK for the mock provider");
    }
    return new MockProvider(...await OAuthBaseProvider.createConstructorArgs({
      discoverFromUrl: getEnvVariable("STACK_OAUTH_MOCK_URL"),
      redirectUri: `${getEnvVariable("STACK_BASE_URL")}/api/v1/auth/oauth/callback/${providerId}`,
      baseScope: "openid",
      isMock: true,
      ...options,
    }));
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet);
    console.log("AAAAAAAAAAAAA", { rawUserInfo });
    throw new Error("Not implemented: Mock user info");

    return validateUserInfo({
      accountId: rawUserInfo.id?.toString(),
      displayName: rawUserInfo.name,
      email: rawUserInfo.email,
      profileImageUrl: rawUserInfo.avatar_url,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
