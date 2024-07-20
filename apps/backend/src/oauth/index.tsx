import OAuth2Server from "@node-oauth/oauth2-server";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { OAuthModel } from "./model";
import { OAuthBaseProvider } from "./providers/base";
import { FacebookProvider } from "./providers/facebook";
import { GithubProvider } from "./providers/github";
import { GoogleProvider } from "./providers/google";
import { MicrosoftProvider } from "./providers/microsoft";
import { SpotifyProvider } from "./providers/spotify";

const _providers = {
  github: GithubProvider,
  google: GoogleProvider,
  facebook: FacebookProvider,
  microsoft: MicrosoftProvider,
  spotify: SpotifyProvider,
} as const;

const _getEnvForProvider = (provider: keyof typeof _providers) => {
  return {
    clientId: getEnvVariable(`STACK_${provider.toUpperCase()}_CLIENT_ID`),
    clientSecret: getEnvVariable(`STACK_${provider.toUpperCase()}_CLIENT_SECRET`),
  };
};

export function getProvider(provider: ProjectsCrud['Admin']['Read']['config']['oauth_providers'][number]): OAuthBaseProvider {
  if (provider.type === 'shared') {
    return new _providers[provider.id]({
      clientId: _getEnvForProvider(provider.id).clientId,
      clientSecret: _getEnvForProvider(provider.id).clientSecret,
    });
  } else {
    return new _providers[provider.id]({
      clientId: provider.client_id || throwErr("Client ID is required for standard providers"),
      clientSecret: provider.client_secret || throwErr("Client secret is required for standard providers"),
    });
  }
}

export const oauthServer = new OAuth2Server({
  model: new OAuthModel(),
  allowExtendedTokenAttributes: true,
});
