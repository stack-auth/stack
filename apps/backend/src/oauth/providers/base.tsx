import { Issuer, generators, CallbackParamsType, Client, TokenSet } from "openid-client";
import { OAuthUserInfo } from "../utils";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { mergeScopeStrings } from "@stackframe/stack-shared/dist/utils/strings";

export abstract class OAuthBaseProvider {
  constructor(
    public readonly oauthClient: Client,
    public readonly scope: string,
    public readonly redirectUri: string,
  ) {}

  protected static async createConstructorArgs(options:
    & {
      clientId: string,
      clientSecret: string,
      redirectUri: string,
      baseScope: string,
      isMock?: boolean,
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

    return [oauthClient, options.baseScope, options.redirectUri] as const;
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
    });
  }

  async getCallback(options: {
    callbackParams: CallbackParamsType,
    codeVerifier: string,
    state: string,
  }): Promise<OAuthUserInfo> {
    let tokenSet;
    const params = {
      code_verifier: options.codeVerifier,
      state: options.state,
    };
    try {
      tokenSet = await this.oauthClient.oauthCallback(this.redirectUri, options.callbackParams, params);
    } catch (error) {
      throw new StackAssertionError(`Inner OAuth callback failed due to error: ${error}`, undefined, { cause: error });
    }
    if (!tokenSet.access_token) {
      throw new StackAssertionError("No access token received", { tokenSet });
    }
    return await this.postProcessUserInfo(tokenSet);
  }

  async getAccessToken(options: {
    refreshToken: string,
    scope?: string,
  }): Promise<TokenSet> {
    return await this.oauthClient.refresh(options.refreshToken, { exchangeBody: { scope: options.scope } });
  }

  abstract postProcessUserInfo(tokenSet: TokenSet): Promise<OAuthUserInfo>;
}
