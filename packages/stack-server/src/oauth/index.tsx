import OAuth2Server from "@node-oauth/oauth2-server";
import { OAuthProviderConfigJson } from "@stackframe/stack-shared";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { GithubProvider } from "./github";
import { OAuthModel } from "./model";
import { OAuthUserInfo } from "./utils";
import { OAuthBaseProvider } from "./oauth-base";
import { GoogleProvider } from "./google";
import { FacebookProvider } from "./facebook";
import { MicrosoftProvider } from "./microsoft";


function getProvider(provider: OAuthProviderConfigJson): OAuthBaseProvider {
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
      if (!provider.tenantId) {
        // this should be prevented by the dashboard and never happen
        throw new Error("Microsoft provider requires tenantId");
      }

      return new MicrosoftProvider({
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
        tenantId: provider.tenantId,
      });
    }
    case "shared-microsoft": {
      return new MicrosoftProvider({
        clientId: getEnvVariable("MICROSOFT_CLIENT_ID"),
        clientSecret: getEnvVariable("MICROSOFT_CLIENT_SECRET"),
        tenantId: getEnvVariable("MICROSOFT_TENANT_ID"),
      });
    }
    default: {
      throw new Error("Not implemented yet for provider: " + provider);
    }
  }
}


export async function getAuthorizationUrl(
  provider: OAuthProviderConfigJson,
  codeVerifier: string,
  state: string,
): Promise<string> {
  // TODO: better error handling
  // TODO: check callback url
  return getProvider(provider).getAuthorizationUrl({
    codeVerifier,
    state,
  });
}

export async function getAuthorizationCallback(
  provider: OAuthProviderConfigJson,
  codeVerifier: string,
  state: string,
  callbackParams: any,
): Promise<OAuthUserInfo> {
  // TODO: better error handling
  // TODO: check callback url
  return await getProvider(provider).getCallback({
    callbackParams,
    codeVerifier,
    state,
  });
}

export const oauthServer = new OAuth2Server({
  model: new OAuthModel(),
});
