import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class CoinbaseProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new CoinbaseProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://coinbase.com",
        authorizationEndpoint: "https://www.coinbase.com/oauth/authorize",
        tokenEndpoint: "https://api.coinbase.com/oauth/token",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/coinbase",
        baseScope: "wallet:user:email+wallet:user:read",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch("https://api.coinbase.com/v2/user", {
      headers: {
        Authorization: `Bearer ${tokenSet.accessToken}`,
      },
    }).then((res) => res.json());
    return validateUserInfo({
      accountId: userInfo.data.id?.toString(),
      displayName: userInfo.data.name,
      email: userInfo.data.email,
      profileImageUrl: userInfo.data.avatar_url as any,
    });
  }
}
