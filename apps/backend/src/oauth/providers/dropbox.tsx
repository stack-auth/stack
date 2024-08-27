import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class DropboxProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new DropboxProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://dropbox.com",
        authorizationEndpoint:
          "https://www.dropbox.com/oauth2/authorize?token_access_type=offline",
        tokenEndpoint: "https://api.dropboxapi.com/oauth2/token",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/dropbox",
        baseScope: "account_info.read",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch(
      "https://api.dropboxapi.com/2/users/get_current_account",
      {
        headers: {
          Authorization: `Bearer ${tokenSet.accessToken}`,
        },
      }
    ).then((res) => res.json());
    return validateUserInfo({
      accountId: userInfo.account_id?.toString(),
      displayName: userInfo.display_name,
      email: userInfo.email,
      profileImageUrl: userInfo.profile_photo_url,
    });
  }
}
