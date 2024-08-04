import { Issuer, generators, CallbackParamsType, Client, TokenSet as OIDCTokenSet } from "openid-client";
import { OAuthUserInfo } from "../utils";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { mergeScopeStrings } from "@stackframe/stack-shared/dist/utils/strings";
import { KnownErrors } from "@stackframe/stack-shared";

export type TokenSet = {
  accessToken: string,
  refreshToken?: string,
  accessTokenExpiredAt: Date,
};

function processTokenSet(tokenSet: OIDCTokenSet): TokenSet {
  if (!tokenSet.access_token) {
    throw new StackAssertionError("No access token received", { tokenSet });
  }

  if (!tokenSet.expires_in) {
    captureError("processTokenSet", "No expires_in received");
  }

  return {
    accessToken: tokenSet.access_token,
    refreshToken: tokenSet.refresh_token,
    accessTokenExpiredAt: tokenSet.expires_in ? new Date(Date.now() + tokenSet.expires_in * 1000) : new Date(Date.now() + 3600 * 1000),
  };
}

export abstract class OAuthBaseProvider {
  constructor(
    public readonly oauthClient: Client,
    public readonly scope: string,
    public readonly redirectUri: string,
    public readonly authorizationExtraParams?: Record<string, string>,
  ) {}

  protected static async createConstructorArgs(options:
    & {
      clientId: string,
      clientSecret: string,
      redirectUri: string,
      baseScope: string,
      authorizationExtraParams?: Record<string, string>,
    }
    & (
      | {
        issuer: string,
        authorizationEndpoint: string,
        tokenEndpoint: string,
        userinfoEndpoint?: string,
      }
      | {
        discoverFromUrl: string,
      }
    )
  ) {
    const issuer = "discoverFromUrl" in options ? await Issuer.discover(options.discoverFromUrl) : new Issuer({
      issuer: options.issuer,
      authorization_endpoint: options.authorizationEndpoint,
      token_endpoint: options.tokenEndpoint,
      userinfo_endpoint: options.userinfoEndpoint,
    });
    const oauthClient = new issuer.Client({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      redirect_uri: options.redirectUri,
      response_types: ["code"],
    });

    // facebook always return an id_token even in the OAuth2 flow, which is not supported by openid-client
    const oldGrant = oauthClient.grant;
    if (!(oldGrant as any)) {
      // it seems that on Sentry, this was undefined in one scenario, so let's log some data to help debug if it happens again
      // not sure if that is actually what was going on? the error log has very few details
      // https://stackframe-pw.sentry.io/issues/5515577938
      throw new StackAssertionError("oldGrant is undefined for some reason — that should never happen!", { options, oauthClient });
    }
    oauthClient.grant = async function (params) {
      const grant = await oldGrant.call(this, params);
      delete grant.id_token;
      return grant;
    };

    return [oauthClient, options.baseScope, options.redirectUri, options.authorizationExtraParams] as const;
  }

  getAuthorizationUrl(options: {
    codeVerifier: string,
    state: string,
    extraScope?: string,
  }) {
    return this.oauthClient.authorizationUrl({
      scope: mergeScopeStrings(this.scope, options.extraScope || ""),
      code_challenge: generators.codeChallenge(options.codeVerifier),
      code_challenge_method: "S256",
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
    const params = {
      code_verifier: options.codeVerifier,
      state: options.state,
    };
    try {
      tokenSet = await this.oauthClient.oauthCallback(this.redirectUri, options.callbackParams, params);
    } catch (error: any) {
      if (error?.error === "invalid_grant") {
        // while this is technically a "user" error, it would only be caused by a client that is not properly implemented
        // to catch the case where our own client is not properly implemented, we capture the error here
        captureError("inner-oauth-callback", error);
        throw new KnownErrors.InvalidAuthorizationCode();
      }
      throw new StackAssertionError(`Inner OAuth callback failed due to error: ${error}`, undefined, { cause: error });

    }

    tokenSet = processTokenSet(tokenSet);

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
    return processTokenSet(tokenSet);
  }

  abstract postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo>;
}
