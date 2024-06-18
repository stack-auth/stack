import { Issuer, generators, CallbackParamsType, Client, TokenSet } from "openid-client";
import { OAuthUserInfo } from "../utils";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { mergeScopeStrings } from "@stackframe/stack-shared/dist/utils/strings";

export abstract class OAuthBaseProvider {
  issuer: Issuer;
  scope: string;
  oauthClient: Client;
  redirectUri: string;

  constructor(options: {
    issuer: string,
    authorizationEndpoint: string,
    tokenEndpoint: string,
    userinfoEndpoint?: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    baseScope: string,
  }) {
    this.issuer = new Issuer({
      issuer: options.issuer,
      authorization_endpoint: options.authorizationEndpoint,
      token_endpoint: options.tokenEndpoint,
      userinfo_endpoint: options.userinfoEndpoint,
    });
    this.oauthClient = new this.issuer.Client({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      redirect_uri: options.redirectUri,
      response_types: ["code"],
    });

    // facebook always return an id_token even in the OAuth2 flow, which is not supported by openid-client
    const oldGrant = this.oauthClient.grant;
    this.oauthClient.grant = async function (params) {
      const grant = await oldGrant.call(this, params);
      delete grant.id_token;
      return grant;
    };

    this.redirectUri = options.redirectUri;
    this.scope = options.baseScope;
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
    try {
      const params = {
        code_verifier: options.codeVerifier,
        state: options.state,
      };
      tokenSet = await this.oauthClient.oauthCallback(this.redirectUri, options.callbackParams, params);
    } catch (error) {
      throw new StackAssertionError("OAuth callback failed", undefined, { cause: error });
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
