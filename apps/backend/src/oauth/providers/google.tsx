import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { OAuthBaseProvider, TokenSet } from "./base";

export class GoogleProvider extends OAuthBaseProvider {
  private constructor(...args: ConstructorParameters<typeof OAuthBaseProvider>) {
    super(...args);
  }

  static async create(options: { clientId: string; clientSecret: string }) {
    return new GoogleProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://accounts.google.com",
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://oauth2.googleapis.com/token",
        userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
        redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/google",
        baseScope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        ...options,
      })),
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const rawUserInfo = await this.oauthClient.userinfo(tokenSet.accessToken);
    return validateUserInfo({
      accountId: rawUserInfo.sub,
      displayName: rawUserInfo.name,
      email: rawUserInfo.email,
      profileImageUrl: rawUserInfo.picture,
      emailVerified: rawUserInfo.email_verified,
    });
  }
}
