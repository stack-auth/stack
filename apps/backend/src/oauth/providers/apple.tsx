import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class AppleProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new AppleProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://appleid.apple.com",
        authorizationEndpoint: "https://appleid.apple.com/auth/authorize",
        tokenEndpoint: "https://appleid.apple.com/auth/token",
        redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/apple",
        baseScope: "name email",
        authorizationExtraParams: { "response_mode": "form_post" },
        tokenEndpointAuthMethod: "client_secret_post",
        noPKCE: true,
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {

    return validateUserInfo({
      accountId: userInfo.id?.toString(),
      displayName: userInfo.name,
      profileImageUrl: userInfo.avatar_url as any,
      email: userInfo.email,
      emailVerified: !!confirmed_at,
    });
  }
}
