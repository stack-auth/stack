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
import { SharedProvider, standardProviders, toStandardProvider } from "@stackframe/stack-shared/dist/interface/clientInterface";

const _providers = {
  github: GithubProvider,
  google: GoogleProvider,
  facebook: FacebookProvider,
  microsoft: MicrosoftProvider,
  spotify: SpotifyProvider,
} as const;

const _getEnvForProvider = (provider: keyof typeof _providers) => {
  return {
    clientId: getEnvVariable(`${provider.toUpperCase()}_CLIENT_ID`),
    clientSecret: getEnvVariable(`${provider.toUpperCase()}_CLIENT_SECRET`),
  };
};

const _isSharedProvider = (provider: OAuthProviderConfigJson): provider is OAuthProviderConfigJson & { type: SharedProvider } => {
  return standardProviders.includes(provider.type as any);
};

export function getProvider(provider: OAuthProviderConfigJson): OAuthBaseProvider {
  if (_isSharedProvider(provider)) {
    const providerName = toStandardProvider(provider.type);
    return new _providers[providerName]({
      clientId: _getEnvForProvider(providerName).clientId,
      clientSecret: _getEnvForProvider(providerName).clientSecret,
      additionalScope: '',
    });
  } else {
    return new _providers[provider.type]({
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      additionalScope: provider.additionalScope,
    });
  }
}

export const oauthServer = new OAuth2Server({
  model: new OAuthModel(),
  allowExtendedTokenAttributes: true,
});
