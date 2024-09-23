import { Issuer, generators, CallbackParamsType, Client, TokenSet as OIDCTokenSet } from "openid-client";
import { OAuthUserInfo } from "../utils";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { mergeScopeStrings } from "@stackframe/stack-shared/dist/utils/strings";
import { KnownErrors } from "@stackframe/stack-shared";

export type TokenSet = {
  accessToken: string,
  refreshToken?: string,
  accessTokenExpiredAt: Date,
  idToken?: string,
};

function processTokenSet(providerName: string, tokenSet: OIDCTokenSet, defaultAccessTokenExpiresInMillis?: number): TokenSet {
  if (!tokenSet.access_token) {
    throw new StackAssertionError("No access token received", { tokenSet });
  }

  // if expires_in or expires_at provided, use that
  // otherwise, if defaultAccessTokenExpiresInMillis provided, use that
  // otherwise, use 1h, and log an error

  if (!tokenSet.expires_in && !tokenSet.expires_at && !defaultAccessTokenExpiresInMillis) {
    captureError("processTokenSet", new StackAssertionError(`No expires_in or expires_at received from OAuth provider ${providerName}. Falling back to 1h`, { tokenSetKeys: Object.keys(tokenSet) }));
  }

  return {
    idToken: tokenSet.id_token,
    accessToken: tokenSet.access_token,
    refreshToken: tokenSet.refresh_token,
    accessTokenExpiredAt: tokenSet.expires_in ?
      new Date(Date.now() + tokenSet.expires_in * 1000) :
      tokenSet.expires_at ? new Date(tokenSet.expires_at * 1000) :
        defaultAccessTokenExpiresInMillis ?
          new Date(Date.now() + defaultAccessTokenExpiresInMillis) :
          new Date(Date.now() + 3600 * 1000),
  };
}

export abstract class OAuthBaseProvider {
  constructor(
    public readonly oauthClient: Client,
    public readonly scope: string,
    public readonly redirectUri: string,
    public readonly authorizationExtraParams?: Record<string, string>,
    public readonly defaultAccessTokenExpiresInMillis?: number,
    public readonly noPKCE?: boolean,
    public readonly openid?: boolean,
  ) {}

  protected static async createConstructorArgs(options:
    & {
      clientId: string,
      clientSecret: string,
      redirectUri: string,
      baseScope: string,
      authorizationExtraParams?: Record<string, string>,
      defaultAccessTokenExpiresInMillis?: number,
      tokenEndpointAuthMethod?: "client_secret_post" | "client_secret_basic",
      noPKCE?: boolean,
    }
    & (
      | ({
        issuer: string,
        authorizationEndpoint: string,
        tokenEndpoint: string,
        userinfoEndpoint?: string,
      }
      & (
        | {
          openid: true,
          jwksUri: string,
        }
        | {
          openid?: false,
        }
      )
    )
      | {
        discoverFromUrl: string,
        openid?: boolean,
      }
    )
  ) {
    const issuer = "discoverFromUrl" in options ? await Issuer.discover(options.discoverFromUrl) : new Issuer({
      issuer: options.issuer,
      authorization_endpoint: options.authorizationEndpoint,
      token_endpoint: options.tokenEndpoint,
      userinfo_endpoint: options.userinfoEndpoint,
      jwks_uri: options.openid ? options.jwksUri : undefined,
    });
    const oauthClient = new issuer.Client({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      redirect_uri: options.redirectUri,
      response_types: ["code"],
      token_endpoint_auth_method: options.tokenEndpointAuthMethod ?? "client_secret_basic",
    });

    return [
      oauthClient,
      options.baseScope,
      options.redirectUri,
      options.authorizationExtraParams,
      options.defaultAccessTokenExpiresInMillis,
      options.noPKCE,
      options.openid,
    ] as const;
  }

  getAuthorizationUrl(options: {
    codeVerifier: string,
    state: string,
    extraScope?: string,
  }) {
    return this.oauthClient.authorizationUrl({
      scope: mergeScopeStrings(this.scope, options.extraScope || ""),
      ...(this.noPKCE ? {} : {
        code_challenge_method: "S256",
        code_challenge: generators.codeChallenge(options.codeVerifier),
      }),
      state: options.state,
      response_type: "code",
      access_type: "offline",
      ...this.authorizationExtraParams,
    });
  }

  async getCallback(options: {
    callbackParams: CallbackParamsType,
    codeVerifier: string,
    state: string,
  }): Promise<{ userInfo: OAuthUserInfo, tokenSet: TokenSet }> {
    let tokenSet;
    const params = [
      this.redirectUri,
      options.callbackParams,
      {
        code_verifier: this.noPKCE ? undefined : options.codeVerifier,
        state: options.state,
      },
    ] as const;

    try {
      if (this.openid) {
        tokenSet = await this.oauthClient.callback(...params);
      } else {
        tokenSet = await this.oauthClient.oauthCallback(...params);
      }
    } catch (error: any) {
      if (error?.error === "invalid_grant") {
        // while this is technically a "user" error, it would only be caused by a client that is not properly implemented
        // to catch the case where our own client is not properly implemented, we capture the error here
        captureError("inner-oauth-callback", error);
        throw new KnownErrors.InvalidAuthorizationCode();
      }
      if (error?.error === 'access_denied') {
        throw new KnownErrors.OAuthProviderAccessDenied();
      }
      throw new StackAssertionError(`Inner OAuth callback failed due to error: ${error}`, undefined, { cause: error });
    }

    tokenSet = processTokenSet(this.constructor.name, tokenSet, this.defaultAccessTokenExpiresInMillis);

    return {
      userInfo: await this.postProcessUserInfo(tokenSet),
      tokenSet,
    };
  }

  async getAccessToken(options: {
    refreshToken: string,
    scope?: string,
  }): Promise<TokenSet> {
    const tokenSet = await this.oauthClient.refresh(options.refreshToken, { exchangeBody: { scope: options.scope } });
    return processTokenSet(this.constructor.name, tokenSet, this.defaultAccessTokenExpiresInMillis);
  }

  abstract postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo>;
}
