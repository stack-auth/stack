import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class XProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new XProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://twitter.com",
        authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
        tokenEndpoint: "https://api.x.com/2/oauth2/token",
        redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/x",
        baseScope: "users.read offline.access tweet.read",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const { data: userInfo } = await fetch(
      "https://api.x.com/2/users/me?user.fields=id,name,profile_image_url",
      {
        headers: {
          Authorization: `Bearer ${tokenSet.accessToken}`,
        },
      }
    ).then((res) => res.json());

    console.log("userInfo", userInfo);

    return validateUserInfo({
      accountId: userInfo?.id?.toString(),
      displayName: userInfo.name || userInfo.username,
      email: null, // There is no way of getting email from X Oauth2.0 API
      profileImageUrl: userInfo.profile_image_url as any,
      emailVerified: false,
    }, { expectNoEmail: true });
  }
}