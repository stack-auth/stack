import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class SpotifyProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: {
    clientId: string,
    clientSecret: string,
  }) {
    return new SpotifyProvider(...await OAuthBaseProvider.createConstructorArgs({
      issuer: "https://accounts.spotify.com",
      authorizationEndpoint: "https://accounts.spotify.com/authorize",
      tokenEndpoint: "https://accounts.spotify.com/api/token",
      redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/spotify",
      baseScope: "user-read-email user-read-private",
      ...options,
    }));
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const info = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenSet.accessToken}`,
      },
    }).then((res) => res.json());

    return validateUserInfo({
      accountId: info.id,
      displayName: info.display_name,
      email: info.email,
      profileImageUrl: info.images?.[0]?.url,
    });
  }
}
