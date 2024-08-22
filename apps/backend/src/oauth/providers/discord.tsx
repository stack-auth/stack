import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { OAuthUserInfo, validateUserInfo } from "../utils";
import { OAuthBaseProvider, TokenSet } from "./base";

export class DiscordProvider extends OAuthBaseProvider {
  private constructor(
    ...args: ConstructorParameters<typeof OAuthBaseProvider>
  ) {
    super(...args);
  }

  static async create(options: {
    clientId: string,
    clientSecret: string,
  }) {
    return new DiscordProvider(...await OAuthBaseProvider.createConstructorArgs({
      issuer: "https://discord.com",
      authorizationEndpoint: "https://discord.com/oauth2/authorize",
      tokenEndpoint: "https://discord.com/api/oauth2/token",
      redirectUri: getEnvVariable("STACK_BASE_URL") + "/api/v1/auth/oauth/callback/discord",
      baseScope: "identify email",
      ...options,
    }));
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const info = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenSet.accessToken}`,
      },
    }).then((res) => res.json());

    return validateUserInfo({
      accountId: info.id,
      displayName: info.global_name ?? info.username,
      email: info.email,
      profileImageUrl: `https://cdn.discordapp.com/avatars/${info.id}/${info.avatar}.${info.avatar.startsWith("a_") ? "gif" : "png"}`,
    });
  }
}
