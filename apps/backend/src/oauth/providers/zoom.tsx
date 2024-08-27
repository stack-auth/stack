import { OAuthBaseProvider, TokenSet } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";

export class ZoomProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: { clientId: string, clientSecret: string }) {
    return new ZoomProvider(
      ...(await OAuthBaseProvider.createConstructorArgs({
        issuer: "https://zoom.us",
        authorizationEndpoint: "https://zoom.us/oauth/authorize?scope",
        tokenEndpoint: "https://zoom.us/oauth/token",
        redirectUri:
          getEnvVariable("STACK_BASE_URL") +
          "/api/v1/auth/oauth/callback/zoom",
        baseScope: "",
        ...options,
      }))
    );
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const userInfo = await fetch(
      "https://api.zoom.us/v2/users/me", {
        headers: {
          Authorization: `Bearer ${tokenSet.accessToken}`
        }
      }
    ).then((res) => res.json());
    return validateUserInfo({
      accountId: userInfo.id.toString(),
      displayName: `${userInfo.first_name} ${userInfo.last_name}`,
      email: userInfo.email,
      profileImageUrl: userInfo.pic_url,
    });
  }
}
