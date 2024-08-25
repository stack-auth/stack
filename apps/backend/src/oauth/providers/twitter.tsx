import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class TwitterProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string; clientSecret: string }) {
    return new TwitterProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://x.com",
        authorizationEndpoint: "https://api.x.com/oauth2/authorize",
        tokenEndpoint: "https://api.x.com/oauth2/token",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/x",
        baseScope: "users.read tweet.read offline.access",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch(
      "https://api.x.com/2/users/me?user.fields=id,name,profile_image_url",
      {
        headers: {
          Authorization: `Bearer ${tokenSet.accessToken}`,
        },
      }
    ).then((res) => res.json());
    // TODO: Recheck it
    return validateUserInfo({
      accountId: userInfo.id?.toString(),
      displayName: userInfo.name,
      email: userInfo?.email, // Oauth2.0 doesn't support email
      profileImageUrl: userInfo.profile_image_url as any,
    });
  }
}
