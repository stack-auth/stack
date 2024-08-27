import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class NetlifyProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new NetlifyProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://netlify.com",
        authorizationEndpoint: "https://app.netlify.com/authorize",
        tokenEndpoint: "https://api.netlify.com/oauth/token",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/netlify",
        baseScope: "",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch("https://api.netlify.com/api/v1/user", {
      headers: {
        Authorization: `Bearer ${tokenSet.accessToken}`,
      },
    }).then((res) => res.json());
    return validateUserInfo({
      accountId: userInfo.id?.toString(),
      displayName: userInfo.full_name,
      email: userInfo.email,
      profileImageUrl: userInfo.avatar_url,
    });
  }
}
