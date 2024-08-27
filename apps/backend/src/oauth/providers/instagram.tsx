import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class InstagramProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new InstagramProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://instagram.com",
        authorizationEndpoint: "https://api.instagram.com/oauth/authorize",
        tokenEndpoint: "https://api.instagram.com/oauth/access_token",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/instagram",
        baseScope: "user_profile",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch(
      "https://graph.instagram.com/me?fields=id,username,account_type,name",
      {
        headers: {
          Authorization: `Bearer ${tokenSet.accessToken}`,
        },
      }
    ).then((res) => res.json());
    return validateUserInfo({
      accountId: userInfo.id?.toString(),
      displayName: userInfo.username,
      email: undefined,
      profileImageUrl: undefined,
    });
  }
}
