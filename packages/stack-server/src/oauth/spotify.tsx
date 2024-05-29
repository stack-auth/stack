import { TokenSet } from "openid-client";
import { OAuthBaseProvider } from "./oauth-base";
import { OAuthUserInfo, validateUserInfo } from "./utils";

export class SpotifyProvider extends OAuthBaseProvider {
  constructor({
    clientId,
    clientSecret,
  }: {
    clientId: string,
    clientSecret: string,
  }) {
    super({
      issuer: "https://accounts.spotify.com",
      authorizationEndpoint: "https://accounts.spotify.com/authorize",
      tokenEndpoint: "https://accounts.spotify.com/api/token",
      userinfoEndpoint: "https://accounts.spotify.com/oidc/userinfo/v1",
      clientId,
      clientSecret,
      redirectUri: process.env.NEXT_PUBLIC_STACK_URL + "/api/v1/auth/callback/spotify",
      scope: "user-read-email user-read-private",
      openid: false,
    });
  }

  async postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo> {
    const info = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenSet.access_token}`,
      },
    }).then((res) => res.json());
    
    return validateUserInfo({
      accountId: info.id,
      displayName: info.display_name,
      email: info.email,
      profileImageUrl: info.images?.[0]?.url,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    });
  }
}
