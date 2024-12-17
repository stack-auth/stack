import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { OAuthBaseProvider, TokenSet } from "./base";

export class EarthoProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: {
    clientId: string,
    clientSecret: string,
  }) {
    return new EarthoProvider(...await OAuthBaseProvider.createConstructorArgs({
      issuer: "https://account.eartho.io",
      discoverFromUrl: "https://account.eartho.io/.well-known/openid-configuration",
      redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/eartho",
      baseScope: "openid profile email",
      noPKCE: false,
      openid: true,
      ...options,
    }));
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const info = await fetch("https://account.eartho.io/api/oidc/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenSet.accessToken}`,
      },
    }).then((res) => res.json());

    return validateUserInfo({
      accountId: info.sub,
      displayName: info.name,
      email: info.email,
      profileImageUrl: info.picture,
      emailVerified: info.email_verified,
    });
  }
}
