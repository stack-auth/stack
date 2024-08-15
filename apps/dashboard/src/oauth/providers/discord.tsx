import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./base";
import { OAuthUserInfo, validateUserInfo } from "../utils";

export class DiscordProvider extends OAuthBaseProvider {
  constructor(options: {
    clientId: string,
    clientSecret: string,
  }) {
    super({
      issuer: "https://discord.com",
      authorizationEndpoint: "https://discord.com/oauth2/authorize",
      tokenEndpoint: "https://discord.com/api/oauth2/token",
      redirectUri: process.env.NEXT_PUBLIC_STACK_URL_DEPRECATED + "/api/v1/auth/callback/discord",
      baseScope: "identify email",
      ...options,
    });
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const info = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenSet.access_token}`,
      },
    }).then((res) => res.json());

    return validateUserInfo({
      accountId: info.id,
      displayName: info.global_name ?? info.username,
      email: info.email,
      profileImageUrl: `https://cdn.discordapp.com/avatars/${info.id}/${info.avatar}.${info.avatar.startsWith("a_") ? "gif" : "png"}`,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
