import OAuth2Server from "@node-oauth/oauth2-server";
import { OAuthProviderConfigJson } from "@stackframe/stack-shared";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { GithubProvider } from "./providers/github";
import { OAuthModel } from "./model";
import { OAuthBaseProvider } from "./providers/base";
import { GoogleProvider } from "./providers/google";
import { FacebookProvider } from "./providers/facebook";
import { MicrosoftProvider } from "./providers/microsoft";
import { SpotifyProvider } from "./providers/spotify";


export function getProvider(provider: OAuthProviderConfigJson): OAuthBaseProvider {
  switch (provider.type) {
    case "github": {
      return new GithubProvider({
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
      });
    }
    case "shared-github": {
      return new GithubProvider({
        clientId: getEnvVariable("GITHUB_CLIENT_ID"),
        clientSecret: getEnvVariable("GITHUB_CLIENT_SECRET"),
      });
    }
    case "google": {
      return new GoogleProvider({
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
      });
    }
    case "shared-google": {
      return new GoogleProvider({
        clientId: getEnvVariable("GOOGLE_CLIENT_ID"),
        clientSecret: getEnvVariable("GOOGLE_CLIENT_SECRET"),
      });
    }
    case "facebook": {
      return new FacebookProvider({
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
      });
    }
    case "shared-facebook": {
      return new FacebookProvider({
        clientId: getEnvVariable("FACEBOOK_CLIENT_ID"),
        clientSecret: getEnvVariable("FACEBOOK_CLIENT_SECRET"),
      });
    }
    case "microsoft": {
      return new MicrosoftProvider({
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
      });
    }
    case "shared-microsoft": {
      return new MicrosoftProvider({
        clientId: getEnvVariable("MICROSOFT_CLIENT_ID"),
        clientSecret: getEnvVariable("MICROSOFT_CLIENT_SECRET"),
      });
    }
    case "spotify": {
      return new SpotifyProvider({
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
      });
    }
    case "shared-spotify": {
      return new SpotifyProvider({
        clientId: getEnvVariable("SPOTIFY_CLIENT_ID"),
        clientSecret: getEnvVariable("SPOTIFY_CLIENT_SECRET"),
      });
    }
    default: {
      throw new Error("Not implemented yet for provider: " + provider);
    }
  }
}

export const oauthServer = new OAuth2Server({
  model: new OAuthModel(),
  allowExtendedTokenAttributes: true,
});
